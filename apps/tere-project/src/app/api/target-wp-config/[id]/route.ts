import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { withLead } from '@server/modules/target-wp-config/target-wp-config-http';

export const dynamic = 'force-dynamic';

export const DELETE = withLead(async (_req, { params, user }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await targetWpConfigService.delete(id, user.email!);
  return new Response(null, { status: 204 });
});

export const PUT = withLead(async (req, { params, user }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  const body = await req.json();
  const { effective_date, rates } = body;
  if (!effective_date || !rates) {
    return Response.json({ error: 'effective_date and rates are required' }, { status: 400 });
  }
  const config = await targetWpConfigService.update(id, effective_date, rates, user.email!);
  return Response.json(config, { status: 200 });
});
