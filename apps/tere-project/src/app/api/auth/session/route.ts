import { membersService } from '@server/modules/members/members.service';
import { isAdmittedMember } from '@server/auth/access-policy';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@src/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Session cookie duration (configurable via env, default 8 hours)
const SESSION_DURATION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS || '8', 10);
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;
const COOKIE_NAME = '__session';

/**
 * POST /api/auth/session
 * Creates a session cookie from a Firebase ID token.
 * Body: { idToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 },
      );
    }

    const user = await adminAuth.verifyIdToken(idToken, true);
    const member = user.email ? await membersService.findByEmail(user.email) : null;
    if (!isAdmittedMember(user, member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Create session cookie via Firebase Admin
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000, // seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 },
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (logout).
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 },
    );
  }
}
