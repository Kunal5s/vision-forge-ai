
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './app/admin/login/actions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except for the login page itself
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = await verifySession();

    if (!session) {
      // If no session, redirect to the login page
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
