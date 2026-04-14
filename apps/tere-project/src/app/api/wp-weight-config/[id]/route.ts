import { withAuth } from '@server/auth/with-auth';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (_req, { params }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await wpWeightConfigService.delete(id);
  return new Response(null, { status: 204 });
});
