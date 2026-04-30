import { withAuth } from '@server/auth/with-auth';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { user }) => {
  const member = await membersService.findByEmail(user.email!);
  if (member?.isLead) {
    const keys = await apiKeysService.findAll();
    return Response.json(keys);
  }
  const keys = await apiKeysService.findByEmail(user.email!);
  return Response.json(keys);
});

export const POST = withAuth(async (req, { user }) => {
  const body = await req.json();
  const name = body?.name;

  if (!name || typeof name !== 'string') {
    return Response.json({ message: 'name is required' }, { status: 400 });
  }

  const result = await apiKeysService.create(name.trim(), user.email!);
  return Response.json(result, { status: 201 });
});
