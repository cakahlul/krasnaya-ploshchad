import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { withWpAuth } from '@server/modules/wp-weight-config/wp-weight-config-http';

export const dynamic = 'force-dynamic';

export const GET = withWpAuth(async (req) => {
  const date = new URL(req.url).searchParams.get('date');
  const weights = await wpWeightConfigService.getEffectiveWeights(date ?? '');
  return Response.json(weights);
});
