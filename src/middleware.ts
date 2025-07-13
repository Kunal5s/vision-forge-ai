// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/app/admin/actions';

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const payload = await decrypt(sessionCookie);

  if (!payload) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Refresh the cookie on activity
  const res = NextResponse.next();
  res.cookies.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // Extend by 2 hours
  });

  return res;
}