import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/analytics',
  '/history',
  '/templates',
  '/workouts',
  '/onboarding',
  '/settings',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get('kinetiq_session')?.value === '1';
  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin')) {
    const role = request.cookies.get('kinetiq_role')?.value;
    if (role !== 'ADMIN') {
      const moreUrl = request.nextUrl.clone();
      moreUrl.pathname = '/more';
      return NextResponse.redirect(moreUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/history/:path*',
    '/templates/:path*',
    '/workouts/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
