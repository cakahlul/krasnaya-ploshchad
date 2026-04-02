import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const members = await membersService.findAll();
  return Response.json(members);
});

export const POST = withAuth(async (req) => {
  const { id, ...body } = await req.json();
  const member = id
    ? await membersService.createWithId(id, body)
    : await membersService.create(body);
  return Response.json(member, { status: 201 });
});
