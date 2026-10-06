import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import {
  getDashboardBoardIdsForMember,
  getDashboardSummary,
  restrictDashboardSummaryToMember,
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
  const boardIdParam = searchParams.get('boardId');
  const boardId = boardIdParam === null ? undefined : Number(boardIdParam);
  if (boardId !== undefined && (!Number.isSafeInteger(boardId) || boardId <= 0)) {
    return Response.json({ message: 'Invalid boardId' }, { status: 400 });
  }

  const boards = await boardsService.findAll();
  const allowedBoardIds = getDashboardBoardIdsForMember(member, boards);
  if (boardId !== undefined) {
    const board = boards.find(b => b.boardId === boardId && !b.isBugMonitoring);
    if (!board) return Response.json({ message: 'Board not found' }, { status: 404 });
    if (allowedBoardIds && !allowedBoardIds.includes(boardId)) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  const summary = await getDashboardSummary(
    startDate,
    endDate,
    boardId === undefined ? allowedBoardIds : [boardId],
  );
  return Response.json(member.isLead ? summary : restrictDashboardSummaryToMember(summary, member.fullName));
});
