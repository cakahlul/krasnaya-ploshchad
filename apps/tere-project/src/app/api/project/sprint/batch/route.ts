import { boardsService } from '@server/modules/boards/boards.service';
import { canAccessBoard } from '@server/auth/access-policy';
import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const boardIdsParam = new URL(req.url).searchParams.get('boardIds');
  if (!boardIdsParam) {
    return Response.json({ message: 'boardIds is required' }, { status: 400 });
  }

  const boardIds = boardIdsParam
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !isNaN(id) && id > 0);

  if (boardIds.length === 0 || boardIds.length > 50 || boardIds.some(id => !Number.isInteger(id))) {
    return Response.json({ message: 'Provide at most 50 positive integer boardIds' }, { status: 400 });
  }

  const boards = await boardsService.findAll();
  if (boardIds.some(id => !boards.some(board => board.boardId === id && canAccessBoard(caller, board)))) return Response.json({ message: 'Forbidden' }, { status: 403 });

  const results = await Promise.all(
    boardIds.map(async (boardId) => {
      const sprints = await sprintService.fetchAllSprint(boardId);
      return sprints.map((sprint) => ({ ...sprint, boardId }));
    }),
  );

  return Response.json(results.flat());
});
