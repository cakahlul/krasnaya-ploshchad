import { boardsService } from '@server/modules/boards/boards.service';
import { canAccessBoard } from '@server/auth/access-policy';
import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const boardId = new URL(req.url).searchParams.get('boardId');
  if (!boardId) {
    return Response.json({ message: 'boardId is required' }, { status: 400 });
  }
  if (!Number.isInteger(Number(boardId)) || Number(boardId) <= 0) return Response.json({ message: 'Invalid boardId' }, { status: 400 });
  const board = (await boardsService.findAll()).find(board => board.boardId === Number(boardId));
  if (!board || !canAccessBoard(caller, board)) return Response.json({ message: 'Forbidden' }, { status: 403 });
  const sprints = await sprintService.fetchAllSprint(Number(boardId));
  return Response.json(sprints);
});
