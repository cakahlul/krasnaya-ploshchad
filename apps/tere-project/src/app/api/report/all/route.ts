import { canAccessProject } from '@server/auth/access-policy';
import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { generateOpenSprintReport } from '@server/modules/reports/reports.service';
import { filterReportForMember } from '@server/modules/reports/report-filter';
import { metadataFromResolution, resolveJiraValue } from '@server/modules/report-source-resolver/report-source-resolver';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  if (!caller || (!caller.isLead && !caller.fullName)) return Response.json({ message: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  if (project && !project.split(',').every(key => canAccessProject(caller, key.trim()))) return Response.json({ message: 'Forbidden' }, { status: 403 });
  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });
  const report = await generateOpenSprintReport(project);
  if (!report) return Response.json({ message: 'No active sprint found' }, { status: 404 });
  const resolved = await resolveJiraValue(filterReportForMember(report, caller), report.issues.length);
  return Response.json({ ...resolved.value, sourceMetadata: metadataFromResolution(resolved) });
});
