import { withAuth } from '@server/auth/with-auth';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (_req, { user, params }) => {
  const { id } = await params!;
  const revoked = await apiKeysService.revoke(id, user.email!);

  if (!revoked) {
    return Response.json({ message: 'API key not found' }, { status: 404 });
  }

  return Response.json({ message: 'API key revoked' });
});
