import { NextRequest, NextResponse } from 'next/server';

/**
 * Checks if the given email is in the admin list
 * Admin emails are configured in ADMIN_EMAILS environment variable
 * as a comma-separated list
 */
function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  return adminList.includes(email.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    const isAdmin = isAdminUser(email);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
