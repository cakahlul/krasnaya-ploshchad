import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { canAccessProject } from '@server/auth/access-policy';
import { isIsoDate } from '@shared/utils/member-lifecycle.util';
import { getEpics } from '@server/modules/reports/reports.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  if (!project.split(',').every(item => /^[A-Za-z][A-Za-z0-9_]*$/.test(item.trim()) && canAccessProject(caller, item.trim()))) return Response.json({ message: 'Forbidden' }, { status: 403 });
  if ((startDate || endDate) ? !(startDate && endDate && isIsoDate(startDate) && isIsoDate(endDate) && startDate <= endDate) : !/^\d+(,\d+)*$/.test(sprint)) return Response.json({ message: 'Invalid report period' }, { status: 400 });

  const stories = await getEpics(sprint, project, startDate, endDate);
  return Response.json(stories);
});
