import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { type AppLocale, routing } from '@/i18n/routing';
import {
  detectPreferredLocale,
  getPathnameLocale,
  isLocale,
  localizeHref,
  stripLocaleFromPathname,
} from '@/lib/locale';

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  const locale: AppLocale =
    getPathnameLocale(pathname) ||
    (isLocale(localeCookie) ? localeCookie : null) ||
    detectPreferredLocale(request.headers.get('accept-language'));
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const isPublicProfilePath = normalizedPathname.startsWith('/profile/');

  // Public paths (accessible without auth)
  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/public'];
  const isPublicPath =
    isPublicProfilePath || publicPaths.some(path => normalizedPathname.startsWith(path));

  // Paths that should ALWAYS be accessible regardless of auth state
  const alwaysPublicPaths = ['/verify-email', '/forgot-password', '/reset-password', '/public'];
  const isAlwaysPublic =
    isPublicProfilePath || alwaysPublicPaths.some(path => normalizedPathname.startsWith(path));

  // Check for accessToken OR refreshToken cookie.
  // accessToken expires in 15 min, but refreshToken lives 7 days.
  // If only refreshToken is present, let the request through — the axios
  // interceptor on the client will refresh the access token automatically.
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  const isAuthenticated = !!accessToken || !!refreshToken;

  // If user is NOT authenticated and trying to access protected page
  if (!isAuthenticated && !isPublicPath && normalizedPathname !== '/') {
    return Response.redirect(new URL(localizeHref('/login', locale), request.url));
  }

  // If user IS authenticated and trying to access login/register
  // (but NOT /verify-email — that should be accessible to everyone)
  if (isAuthenticated && isPublicPath && !isAlwaysPublic) {
    return Response.redirect(new URL(localizeHref('/dashboard', locale), request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
