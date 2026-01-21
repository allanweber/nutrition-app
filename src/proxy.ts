import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // Skip auth for API routes, static files, auth routes, and legal pages
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/terms') ||
    request.nextUrl.pathname.startsWith('/privacy')
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
