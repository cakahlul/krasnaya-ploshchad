import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req) => {
  const boardId = new URL(req.url).searchParams.get('boardId');
  if (!boardId) {
    return Response.json({ message: 'boardId is required' }, { status: 400 });
  }
  const sprints = await sprintService.fetchAllSprint(Number(boardId));
  return Response.json(sprints);
});
