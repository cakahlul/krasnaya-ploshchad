import { withAuth } from '@server/auth/with-auth';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const GET = withAuth(async (req) => {
  const boardId = new URL(req.url).searchParams.get('boardId');
  if (!boardId) {
    return Response.json({ message: 'boardId is required' }, { status: 400 });
  }
  const sprints = await sprintService.fetchAllSprint(Number(boardId));
  return Response.json(sprints);
});
