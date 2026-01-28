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

function extractFirstGenericTableImageSrc(html: string): string | null {
  const tableIndex = html.toLowerCase().indexOf('<table class="generic"');
  if (tableIndex < 0) return null;

  const slice = html.slice(tableIndex, tableIndex + 50_000);
  const imgMatch = /<img[^>]+src\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(slice);
  return imgMatch?.[1] ?? imgMatch?.[2] ?? null;
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
  const src = extractFirstGenericTableImageSrc(html);

  const imageUrl = src ? toAbsoluteUrl(normalized, src) : null;
  foodUrlImageCache.set(normalized, imageUrl);
  return imageUrl;
}
