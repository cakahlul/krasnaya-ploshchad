import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { withLead } from '@server/modules/wp-weight-config/wp-weight-config-http';

export const dynamic = 'force-dynamic';

export const DELETE = withLead(async (_req, { params }) => {
  const { id = '' } = await params!;
  await wpWeightConfigService.delete(id);
  return new Response(null, { status: 204 });
});
