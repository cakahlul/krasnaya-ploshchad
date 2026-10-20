import { withAuth } from '@server/auth/with-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

export const GET = withAuth(async (_request, { user }) => {
  return NextResponse.json({ isAdmin: isAdminUser(user.email) });
});
