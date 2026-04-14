import { withAuth } from '@server/auth/with-auth';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const configs = await wpWeightConfigService.fetchAll();
  return Response.json(configs);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { effective_date, weights } = body;
  if (!effective_date || !weights) {
    return Response.json({ error: 'effective_date and weights are required' }, { status: 400 });
  }
  const config = await wpWeightConfigService.create(effective_date, weights);
  return Response.json(config, { status: 201 });
});
