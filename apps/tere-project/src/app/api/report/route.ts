import { withAuth } from '@server/auth/with-auth';
import { generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const epicId = searchParams.get('epicId') ?? undefined;

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  if (startDate && endDate) {
    const report = await generateReportByDateRange(startDate, endDate, project, epicId);
    return Response.json(report);
  }

  if (!sprint) return Response.json({ message: 'sprint or date range is required' }, { status: 400 });
  const report = await generateReport(sprint, project, epicId);
  return Response.json(report);
});
