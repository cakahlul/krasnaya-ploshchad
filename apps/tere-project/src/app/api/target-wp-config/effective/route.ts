import { withAuth } from '@server/auth/with-auth';
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const date = new URL(req.url).searchParams.get('date');
  if (!date) return Response.json({ error: 'date query param is required (YYYY-MM-DD)' }, { status: 400 });
  const rates = await targetWpConfigService.getEffectiveRates(date);
  return Response.json(rates);
});
