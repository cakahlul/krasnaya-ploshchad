import { withAuthOrApiKey, type CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';
import type { GetReportResponseDto } from '@shared/types/report.types';

export const dynamic = 'force-dynamic';

function filterReportForMember(report: GetReportResponseDto, caller: CallerIdentity): GetReportResponseDto {
  if (caller.isLead || !caller.fullName) return report;
  const myIssues = report.issues.filter(i => i.member === caller.fullName);
  return { ...report, issues: myIssues };
}

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
