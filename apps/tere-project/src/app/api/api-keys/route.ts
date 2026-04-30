import { withRole } from '@server/auth/with-role';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';

export const dynamic = 'force-dynamic';

export const GET = withRole('Lead', async () => {
  const keys = await apiKeysService.findAll();
  return Response.json(keys);
});

export const POST = withRole('Lead', async (req, { user }) => {
  const body = await req.json();
  const name = body?.name;

  if (!name || typeof name !== 'string') {
    return Response.json({ message: 'name is required' }, { status: 400 });
  }

  const result = await apiKeysService.create(name.trim(), user.email!);
  return Response.json(result, { status: 201 });
});
