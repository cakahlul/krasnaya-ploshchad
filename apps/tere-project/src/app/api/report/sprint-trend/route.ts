import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { generateSprintTrend } from '@server/modules/reports/reports.service';
import { metadataFromResolution, resolveJiraValue } from '@server/modules/report-source-resolver/report-source-resolver';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async req => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprintsParam = searchParams.get('sprints') ?? '';

  if (!project) {
    return Response.json({ message: 'project is required' }, { status: 400 });
  }
  if (!sprintsParam) {
    return Response.json({ message: 'sprints is required' }, { status: 400 });
  }

  const sprintIds = sprintsParam.split(',').map(s => s.trim()).filter(Boolean);
  const trend = await generateSprintTrend(sprintIds, project);
  const resolved = await resolveJiraValue(trend, trend.points.length);
  const sourceMetadata = metadataFromResolution(resolved);
  return Response.json({
    ...resolved.value,
    sourceMetadata,
    points: resolved.value.points.map(point => ({ ...point, sourceMetadata })),
  });
});
