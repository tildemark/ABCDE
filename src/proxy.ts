import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // 1. Enforce Role-Based Access Control (RBAC) at the routing layer
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect to login page if unauthenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const role = token.role as string;
    
    // HR Executives & System Admins only for Payroll admin routes
    if (pathname.startsWith('/admin/payroll') && role !== 'HR_Exec' && role !== 'System Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // HR Executives, Timekeepers, and System Admins for Timekeeping admin routes
    if (pathname.startsWith('/admin/timekeeping') && 
        role !== 'HR_Exec' && 
        role !== 'Timekeeper' && 
        role !== 'System Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 2. Click-Wrap Privacy Policy Interception (RA 10173 / Data Privacy Act of 2012 compliance)
  // If user is authenticated but has not consented to privacy terms, redirect to consent page
  if (token && token.hasConsented === false && pathname !== '/consent' && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/consent', request.url));
  }

  return NextResponse.next();
}

// Map the routes that require session guards
export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*', 
    '/employee/:path*'
  ],
};
