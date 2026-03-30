import { withAuth } from '@server/auth/with-auth';
import { getDashboardSummary } from '@server/modules/dashboard/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const summary = await getDashboardSummary();
  return Response.json(summary);
});
