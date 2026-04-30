import { withAuth } from '@server/auth/with-auth';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (_req, { user, params }) => {
  const { id } = await params!;
  const member = await membersService.findByEmail(user.email!);
  const revoked = await apiKeysService.revoke(id, member?.isLead ? undefined : user.email!);

  if (!revoked) {
    return Response.json({ message: 'API key not found' }, { status: 404 });
  }

  return Response.json({ message: 'API key revoked' });
});
