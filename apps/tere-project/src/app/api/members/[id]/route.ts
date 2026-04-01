import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const member = await membersService.findOne(id);
  return Response.json(member);
});

export const PUT = withAuth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const member = await membersService.update(id, body);
  return Response.json(member);
});

export const DELETE = withAuth(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await membersService.remove(id);
  return new Response(null, { status: 204 });
});
