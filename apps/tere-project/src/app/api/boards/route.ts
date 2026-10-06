import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { boardsService } from '@server/modules/boards/boards.service';
import { membersService } from '@server/modules/members/members.service';
import { getDashboardBoardIdsForMember } from '@server/modules/dashboard/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (_req, { caller }) => {
  const member = caller && await membersService.findByEmail(caller.email);
  if (!member) return Response.json({ message: 'Forbidden' }, { status: 403 });

  const boards = await boardsService.findAll();
  const allowedBoardIds = new Set(getDashboardBoardIdsForMember(member, boards));
  return Response.json(boards.filter(board =>
    !board.isBugMonitoring && allowedBoardIds.has(board.boardId),
  ));
});
