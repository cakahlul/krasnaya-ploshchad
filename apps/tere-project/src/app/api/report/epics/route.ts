import { withAuth } from '@server/auth/with-auth';
import { getEpics } from '@server/modules/reports/reports.service';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  const epics = await getEpics(sprint, project, startDate, endDate);
  return Response.json(epics);
});
