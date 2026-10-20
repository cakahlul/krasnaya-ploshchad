import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';
import { searchService } from '@server/modules/search/search.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { params, user }) => {
  const member = await membersService.findByEmail(user.email!);
  const { key } = await params!;
  const ticket = await searchService.getTicketDetail(key, member?.isLead ? null : member?.teams?.map(team => team.toUpperCase()) ?? []);
  if (!ticket) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
  return Response.json(ticket);
});
