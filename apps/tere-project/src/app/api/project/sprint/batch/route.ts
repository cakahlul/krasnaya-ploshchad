import { withAuth } from '@server/auth/with-auth';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const boardIdsParam = new URL(req.url).searchParams.get('boardIds');
  if (!boardIdsParam) {
    return Response.json({ message: 'boardIds is required' }, { status: 400 });
  }

  const boardIds = boardIdsParam
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !isNaN(id) && id > 0);

  if (boardIds.length === 0) {
    return Response.json({ message: 'No valid boardIds provided' }, { status: 400 });
  }

  const results = await Promise.all(
    boardIds.map(async (boardId) => {
      const sprints = await sprintService.fetchAllSprint(boardId);
      return sprints.map((sprint) => ({ ...sprint, boardId }));
    }),
  );

  return Response.json(results.flat());
});
