import { withRole } from '@server/auth/with-role';

import { apiKeysService } from '@server/modules/api-keys/api-keys.service';

export const dynamic = 'force-dynamic';

export const DELETE = withRole('Lead', async (_req, { params }) => {
  const { id } = await params!;
  const revoked = await apiKeysService.revoke(id);

  if (!revoked) {
    return Response.json({ message: 'API key not found' }, { status: 404 });
  }

  return Response.json({ message: 'API key revoked' });
});
