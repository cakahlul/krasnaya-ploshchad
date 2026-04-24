import { withAuth, type AuthedHandler } from './with-auth';
import { membersService } from '@server/modules/members/members.service';

export function withRole(role: string, handler: AuthedHandler) {
  return withAuth(async (req, context) => {
    const member = await membersService.findByEmail(context.user.email!);

    const memberRole = member?.isLead ? 'Lead' : 'Member';

    if (memberRole !== role) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    return handler(req, context);
  });
}
