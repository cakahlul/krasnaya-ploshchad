import { withAuth } from '@server/auth/with-auth';
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (_req, { params }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await targetWpConfigService.delete(id);
  return new Response(null, { status: 204 });
});
