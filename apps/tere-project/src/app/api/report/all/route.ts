import { withAuth } from '@server/auth/with-auth';
import { generateOpenSprintReport } from '@server/modules/reports/reports.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });
  const report = await generateOpenSprintReport(project);
  if (!report) return Response.json({ message: 'No active sprint found' }, { status: 404 });
  return Response.json(report);
});
