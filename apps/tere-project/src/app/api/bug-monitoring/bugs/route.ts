import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { bugMonitoringService } from '@server/modules/bug-monitoring/bug-monitoring.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req) => {
  const params = new URL(req.url).searchParams;
  const boardId = params.get('boardId');
  const nocP1CodeIssue = params.get('nocP1CodeIssue') === 'true';
  const allBoards = params.get('allBoards') === 'true';
  if (!boardId && !nocP1CodeIssue && !allBoards) {
    return Response.json({ message: 'boardId is required' }, { status: 400 });
  }
  const data = nocP1CodeIssue
    ? await bugMonitoringService.getNocP1CodeIssues(boardId ? Number(boardId) : undefined)
    : allBoards
      ? await bugMonitoringService.getBugsForBoards(boardId ? Number(boardId) : undefined)
      : await bugMonitoringService.getBugsForBoard(Number(boardId));
  return Response.json(data);
});
