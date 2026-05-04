import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';
import { filterReportForMember } from '@server/modules/reports/report-filter';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const epicId = searchParams.get('epicId') ?? undefined;

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  if (startDate && endDate) {
    const report = await generateReportByDateRange(startDate, endDate, project, epicId);
    return Response.json(caller ? filterReportForMember(report, caller) : report);
  }

  if (!sprint) return Response.json({ message: 'sprint or date range is required' }, { status: 400 });
  const report = await generateReport(sprint, project, epicId);
  return Response.json(caller ? filterReportForMember(report, caller) : report);
});
