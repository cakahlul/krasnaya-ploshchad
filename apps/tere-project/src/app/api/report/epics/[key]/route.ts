import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import {
  getEpicDetail,
  EpicExplorerError,
} from '@server/modules/reports/epic-explorer.service';

export const dynamic = 'force-dynamic';

const PROJECT_KEY = /^[A-Za-z][A-Za-z0-9_]*$/;
const EPIC_KEY = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;

export const GET = withAuthOrApiKey(async (req, context) => {
  const params = await context?.params;
  const key = params?.key ?? '';
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';

  if (!project || !PROJECT_KEY.test(project)) {
    return Response.json({ message: 'project is required' }, { status: 400 });
  }
  if (!EPIC_KEY.test(key)) {
    return Response.json({ message: 'Invalid epic key' }, { status: 400 });
  }
  if (!context?.caller) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const detail = await getEpicDetail(key, project, context.caller);
    return Response.json(detail);
  } catch (error) {
    if (error instanceof EpicExplorerError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    // Unexpected failure — treat as upstream (never collapse to 200-empty, FR-09).
    console.error('[GET /api/report/epics/[key]] unexpected error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 502 });
  }
});
