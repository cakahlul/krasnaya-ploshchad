import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import {
  getDashboardBoardIdsForMember,
  getDashboardSummary,
} from '@server/modules/dashboard/dashboard.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { membersService } from '@server/modules/members/members.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const member = caller && await membersService.findByEmail(caller.email);
  if (!member) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const allowedBoardIds = member.isLead
    ? undefined
    : getDashboardBoardIdsForMember(member, await boardsService.findAll());
  const summary = await getDashboardSummary(startDate, endDate, allowedBoardIds);
  return Response.json(summary);
});
