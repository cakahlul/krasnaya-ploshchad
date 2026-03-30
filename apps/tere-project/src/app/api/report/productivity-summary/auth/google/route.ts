import { withAuth } from '@server/auth/with-auth';
import { getAuthUrl } from '@server/lib/google-oauth.client';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const authUrl = getAuthUrl();
  return Response.json({ authUrl });
});
