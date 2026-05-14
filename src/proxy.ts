import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// In-memory rate limiter — 60 requests/minute per IP for /foods/** and /api/foods/search
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Cleanup stale entries on each check
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

function isRateLimitedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/foods/') || pathname === '/api/foods/public/search'
  );
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** PWA / favicon assets in `public/` must bypass auth middleware. */
const PUBLIC_BRAND_PATHS = new Set([
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.png',
  '/site.webmanifest',
]);

export async function proxy(request: NextRequest) {
  if (PUBLIC_BRAND_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Rate limiting — checked BEFORE auth to avoid unnecessary session overhead
  if (isRateLimitedPath(request.nextUrl.pathname)) {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  // Skip auth for API routes, static files, auth routes, and legal pages
  if (
    request.nextUrl.pathname.startsWith('/api/foods/public/') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/foods/') ||
    request.nextUrl.pathname.startsWith('/terms') ||
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/verify-email')
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add user info to headers for server components
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.user.id.toString());
  response.headers.set('x-user-email', session.user.email);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
