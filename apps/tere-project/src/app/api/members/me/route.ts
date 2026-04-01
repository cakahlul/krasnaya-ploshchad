import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { user }) => {
  if (!user.email) {
    return Response.json({ message: 'No email in token' }, { status: 400 });
  }
  const member = await membersService.findByEmail(user.email);
  return Response.json(member ?? null);
});
