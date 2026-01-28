import { LRUCache } from './cache';

const MAX_CACHE_ITEMS = 1000;
const TTL_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Cache food_url -> image URL (or null if no image was found)
export const foodUrlImageCache = new LRUCache<string, string | null>(
  MAX_CACHE_ITEMS,
  TTL_30_DAYS_MS,
);

function isAllowedFoodUrl(foodUrl: string): boolean {
  try {
    const url = new URL(foodUrl);
    const host = url.hostname.toLowerCase();

    // Restrict to FatSecret-owned domains to avoid SSRF.
    return (
      host === 'www.fatsecret.com' ||
      host === 'fatsecret.com' ||
      host.endsWith('.fatsecret.com') ||
      host === 'm.ftscrt.com' ||
      host.endsWith('.ftscrt.com')
    );
  } catch {
    return false;
  }
}

function toAbsoluteUrl(baseUrl: string, src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return new URL(src, baseUrl).toString();
}

function extractBestImageSrc(htmlSlice: string): string | null {
  const matches = Array.from(
    htmlSlice.matchAll(/<img[^>]+src\s*=\s*(?:"([^"]+)"|'([^']+)')/gi),
  ).map((m) => m[1] ?? m[2]).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  if (matches.length === 0) return null;

  // Prefer actual food photos over icons/ads/etc.
  const preferred = matches.find((src) => /\/food\//i.test(src) && /_sq\.(jpg|jpeg|png|webp)$/i.test(src))
    ?? matches.find((src) => /\/food\//i.test(src) && /\.(jpg|jpeg|png|webp)$/i.test(src))
    ?? matches.find((src) => /\.(jpg|jpeg|png|webp)$/i.test(src))
    ?? matches[0];

  return preferred ?? null;
}

function extractPhotosSectionImageSrc(html: string): string | null {
  const lower = html.toLowerCase();

  // The Photos section is typically headed by an <h4> that contains the word "Photos"
  // (often preceded by an icon <img>). We look for the closing tag so we can start
  // scanning AFTER the header to avoid picking the camera icon.
  const photosHeaderClose = lower.indexOf('photos</h4>');
  if (photosHeaderClose < 0) return null;

  const headerEnd = lower.indexOf('</h4>', photosHeaderClose);
  if (headerEnd < 0) return null;

  const searchFrom = headerEnd + '</h4>'.length;
  const tableIndex = lower.indexOf('<table class="generic"', searchFrom);
  if (tableIndex < 0) return null;

  // The Photos table is small; grab a bounded slice to keep work cheap.
  const slice = html.slice(tableIndex, tableIndex + 30_000);
  return extractBestImageSrc(slice);
}

function extractFirstGenericTableImageSrc(html: string): string | null {
  const tableIndex = html.toLowerCase().indexOf('<table class="generic"');
  if (tableIndex < 0) return null;

  const slice = html.slice(tableIndex, tableIndex + 50_000);
  return extractBestImageSrc(slice);
}

async function fetchHtmlFollowingAllowedRedirects(
  url: string,
  maxRedirects = 3,
): Promise<Response> {
  let current = url;

  for (let i = 0; i <= maxRedirects; i += 1) {
    const response = await fetch(current, {
      cache: 'no-store',
      redirect: 'manual',
      headers: {
        // A basic UA helps avoid some anti-bot blocks.
        'User-Agent': 'nutrition-app/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return response;

      const nextUrl = new URL(location, current).toString();
      if (!isAllowedFoodUrl(nextUrl)) {
        throw new Error('Unsupported foodUrl host');
      }

      current = nextUrl;
      continue;
    }

    // Final response (200/4xx/5xx)
    if (response.url && !isAllowedFoodUrl(response.url)) {
      // Defense in depth: avoid unexpected host changes.
      throw new Error('Unsupported foodUrl host');
    }

    return response;
  }

  throw new Error('Too many redirects');
}

export async function getFoodImageUrlForFoodUrl(foodUrl: string): Promise<string | null> {
  const normalized = foodUrl.trim();

  if (!normalized) return null;
  if (!isAllowedFoodUrl(normalized)) {
    throw new Error('Unsupported foodUrl host');
  }

  const cached = foodUrlImageCache.get(normalized);
  if (cached !== undefined) return cached;

  const response = await fetchHtmlFollowingAllowedRedirects(normalized);

  if (!response.ok) {
    foodUrlImageCache.set(normalized, null);
    return null;
  }

  const html = await response.text();
  const src = extractPhotosSectionImageSrc(html) ?? extractFirstGenericTableImageSrc(html);

  const imageUrl = src ? toAbsoluteUrl(normalized, src) : null;
  foodUrlImageCache.set(normalized, imageUrl);
  return imageUrl;
}
