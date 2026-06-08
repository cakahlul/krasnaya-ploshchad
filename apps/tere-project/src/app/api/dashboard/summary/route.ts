import { withAuth } from '@server/auth/with-auth';
import { getDashboardSummary } from '@server/modules/dashboard/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const summary = await getDashboardSummary(startDate, endDate);
  return Response.json(summary);
});
