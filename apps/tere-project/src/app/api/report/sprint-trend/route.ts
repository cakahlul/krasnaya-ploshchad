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
  const resolved = await resolveJiraValue(trend, sprintIds.length);
  const liveMetadata = metadataFromResolution(resolved);
  const unavailablePoints = trend.points.filter(point => point.sourceMetadata?.source === 'unavailable');
  const sourceMetadata = unavailablePoints.length === 0
    ? liveMetadata
    : {
      ...liveMetadata,
      source: unavailablePoints.length === sprintIds.length ? 'unavailable' as const : 'partial' as const,
      coverage: {
        status: unavailablePoints.length === sprintIds.length ? 'unavailable' as const : 'partial' as const,
        expected: sprintIds.length,
        covered: sprintIds.length - unavailablePoints.length,
      },
      reason: unavailablePoints[0].sourceMetadata?.reason ?? 'SPRINT_REPORT_UNAVAILABLE',
      warning: unavailablePoints.length === sprintIds.length
        ? 'Sprint reports are unavailable'
        : 'Some sprint reports are unavailable',
    };
  const report = resolved.value ?? trend;
  return Response.json({
    ...report,
    sourceMetadata,
    points: report.points.map(point => ({ ...point, sourceMetadata: point.sourceMetadata ?? sourceMetadata })),
  });
});
