import { withAuth } from '@server/auth/with-auth';
import { exportProductivitySummaryToSpreadsheet } from '@server/modules/reports/productivity-summary.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const month = parseInt(body.month, 10);
  const year = parseInt(body.year, 10);
  const accessToken = body.accessToken;
  const teams = body.teams ? (body.teams as string).split(',').map((t: string) => t.trim()).filter(Boolean) : undefined;
  if (!month || !year || !accessToken) return Response.json({ message: 'month, year, and accessToken are required' }, { status: 400 });
  try {
    const result = await exportProductivitySummaryToSpreadsheet(month, year, accessToken, teams);
    return Response.json(result);
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
});
