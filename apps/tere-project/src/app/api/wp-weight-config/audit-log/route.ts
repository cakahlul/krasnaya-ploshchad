import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { withLead } from '@server/modules/wp-weight-config/wp-weight-config-http';

export const dynamic = 'force-dynamic';

export const GET = withLead(async req => {
  const cursor = new URL(req.url).searchParams.get('cursor');
  return Response.json(await wpWeightConfigService.fetchAuditLog(cursor));
});
