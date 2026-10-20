import { auth } from '@server/lib/firebase-admin';
import { membersService } from '@server/modules/members/members.service';
import { isAdmittedMember } from '@server/auth/access-policy';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = '__session';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/api/', '/_next/', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths to pass through
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow root page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session cookie → redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const user = await auth.verifySessionCookie(sessionCookie.value, true);
    const member = user.email ? await membersService.findByEmail(user.email) : null;
    if (isAdmittedMember(user, member)) return NextResponse.next();
  } catch {
    // Invalid, expired, and revoked sessions all require a new sign-in.
  }
  const response = NextResponse.redirect(new URL('/sign-in', request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
