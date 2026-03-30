import { withAuth } from '@server/auth/with-auth';
import { userAccessService } from '@server/modules/user-access/user-access.service';

export const GET = withAuth(async (_req, { params }) => {
  const { email } = await params!;
  const role = await userAccessService.getUserRole(email);
  return Response.json({ role });
});
