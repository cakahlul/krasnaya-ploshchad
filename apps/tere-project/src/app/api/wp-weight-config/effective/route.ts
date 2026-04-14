import { withAuth } from '@server/auth/with-auth';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const date = new URL(req.url).searchParams.get('date');
  if (!date) return Response.json({ error: 'date query param is required (YYYY-MM-DD)' }, { status: 400 });
  const weights = await wpWeightConfigService.getEffectiveWeights(date);
  return Response.json(weights);
});
