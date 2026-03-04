import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths (accessible without auth)
  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Paths that should ALWAYS be accessible regardless of auth state
  const alwaysPublicPaths = ['/verify-email', '/forgot-password', '/reset-password'];
  const isAlwaysPublic = alwaysPublicPaths.some(path => pathname.startsWith(path));

  // Check for accessToken OR refreshToken cookie.
  // accessToken expires in 15 min, but refreshToken lives 7 days.
  // If only refreshToken is present, let the request through — the axios
  // interceptor on the client will refresh the access token automatically.
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  const isAuthenticated = !!accessToken || !!refreshToken;

  // If user is NOT authenticated and trying to access protected page
  if (!isAuthenticated && !isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user IS authenticated and trying to access login/register
  // (but NOT /verify-email — that should be accessible to everyone)
  if (isAuthenticated && isPublicPath && !isAlwaysPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
