import { withAuth } from '@server/auth/with-auth';
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const configs = await targetWpConfigService.fetchAll();
  return Response.json(configs);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { effective_date, rates } = body;
  if (!effective_date || !rates) {
    return Response.json({ error: 'effective_date and rates are required' }, { status: 400 });
  }
  const config = await targetWpConfigService.create(effective_date, rates);
  return Response.json(config, { status: 201 });
});
