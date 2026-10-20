import { withRole } from '@server/auth/with-role';
import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, { user }) => {
  const member = await membersService.findByEmail(user.email!);
  const dashboard = new URL(req.url).searchParams.get('scope') === 'dashboard';
  const members = member?.isLead
    ? dashboard ? await membersService.findActiveTeamMembers(member.teams) : await membersService.findAll()
    : member ? [member] : [];
  return Response.json(members);
});

export const POST = withRole('Lead', async (req) => {
  const body = await req.json();
  const member = await membersService.create(body);
  return Response.json(member, { status: 201 });
});
