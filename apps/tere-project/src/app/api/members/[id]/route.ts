import { withRole } from '@server/auth/with-role';
import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { params, user }) => {
  const { id } = await params!;
  const caller = await membersService.findByEmail(user.email!);
  if (!caller || (!caller.isLead && caller.id !== id)) return Response.json({ message: 'Forbidden' }, { status: 403 });
  const member = await membersService.findOne(id);
  return Response.json(member);
});

export const PUT = withRole('Lead', async (req, { params }) => {
  const { id } = await params!;
  const body = await req.json();
  const member = await membersService.update(id, body);
  return Response.json(member);
});

export const DELETE = withRole('Lead', async (_req, { params }) => {
  const { id } = await params!;
  await membersService.remove(id);
  return new Response(null, { status: 204 });
});
