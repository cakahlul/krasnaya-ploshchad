import { withAuthOrApiKey, type CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { generateOpenSprintReport } from '@server/modules/reports/reports.service';
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
  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });
  const report = await generateOpenSprintReport(project);
  if (!report) return Response.json({ message: 'No active sprint found' }, { status: 404 });
  return Response.json(caller ? filterReportForMember(report, caller) : report);
});
