import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { withLead } from '@server/modules/target-wp-config/target-wp-config-http';

export const dynamic = 'force-dynamic';

export const DELETE = withLead(async (_req, { params, user }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await targetWpConfigService.delete(id, user.email!);
  return new Response(null, { status: 204 });
});
