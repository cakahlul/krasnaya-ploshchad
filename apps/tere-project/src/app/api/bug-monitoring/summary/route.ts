import { withAuth } from '@server/auth/with-auth';
import { bugMonitoringService } from '@server/modules/bug-monitoring/bug-monitoring.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const boardId = new URL(req.url).searchParams.get('boardId');
  if (!boardId) {
    return Response.json({ message: 'boardId is required' }, { status: 400 });
  }
  const data = await bugMonitoringService.getBugSummary(Number(boardId));
  return Response.json(data);
});
