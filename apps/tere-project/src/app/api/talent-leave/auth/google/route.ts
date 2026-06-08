import { withAuth } from '@server/auth/with-auth';
import { getAuthUrl } from '@server/lib/google-oauth.client';
import { userAccessService } from '@server/modules/user-access/user-access.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { user }) => {
  const role = user.email ? await userAccessService.getUserRole(user.email) : 'Member';
  if (role !== 'Lead') return Response.json({ message: 'Forbidden' }, { status: 403 });

  const authUrl = getAuthUrl();
  return Response.json({ authUrl });
});
