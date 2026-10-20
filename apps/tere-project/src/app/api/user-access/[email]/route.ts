import { withAuth } from '@server/auth/with-auth';
import { userAccessService } from '@server/modules/user-access/user-access.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { params, user }) => {
  const { email } = await params!;
  if (email !== user.email && await userAccessService.getUserRole(user.email!) !== 'Lead') return Response.json({ message: 'Forbidden' }, { status: 403 });
  const role = await userAccessService.getUserRole(email);
  return Response.json({ role });
});
