import { withAuth } from '@server/auth/with-auth';
import { generateProductivitySummary } from '@server/modules/reports/productivity-summary.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? '0', 10);
  const year = parseInt(searchParams.get('year') ?? '0', 10);
  if (!month || !year) return Response.json({ message: 'month and year are required' }, { status: 400 });
  const teamsParam = searchParams.get('teams') ?? '';
  const teams = teamsParam ? teamsParam.split(',').map(t => t.trim()).filter(Boolean) : undefined;
  const data = await generateProductivitySummary(month, year, teams);
  return Response.json(data);
});
