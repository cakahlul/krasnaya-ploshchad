import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { getEpics } from '@server/modules/reports/reports.service';
import {
  getProjectEpics,
  EpicExplorerError,
} from '@server/modules/reports/epic-explorer.service';

export const dynamic = 'force-dynamic';

const PROJECT_KEY = /^[A-Za-z][A-Za-z0-9_]*$/;

export const GET = withAuthOrApiKey(async (req, context) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  // Epic Explorer branch (SLS-16799): project-wide list, no sprint/date scope.
  if (!sprint && !startDate && !endDate) {
    if (!PROJECT_KEY.test(project)) {
      return Response.json({ message: 'Invalid project' }, { status: 400 });
    }
    if (!context?.caller) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
      const epics = await getProjectEpics(project, context.caller);
      return Response.json(epics);
    } catch (error) {
      if (error instanceof EpicExplorerError) {
        return Response.json({ message: error.message }, { status: error.status });
      }
      // Unexpected failure — treat as upstream (never collapse to 200-empty, FR-09).
      console.error('[GET /api/report/epics] unexpected error:', error);
      return Response.json({ message: 'Internal server error' }, { status: 502 });
    }
  }

  // Team Reporting branch (existing, assignee-scoped): unchanged EpicDto[] shape.
  const epics = await getEpics(sprint, project, startDate, endDate);
  return Response.json(epics);
});
