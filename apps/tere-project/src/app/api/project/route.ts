import { withAuth } from '@server/auth/with-auth';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const projects = await sprintService.fetchAllProject();
  return Response.json(projects);
});
