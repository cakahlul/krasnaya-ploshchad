import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { withLead } from '@server/modules/target-wp-config/target-wp-config-http';

export const dynamic = 'force-dynamic';

export const GET = withLead(async req => {
  const cursor = new URL(req.url).searchParams.get('cursor');
  return Response.json(await targetWpConfigService.fetchAuditLog(cursor));
});
