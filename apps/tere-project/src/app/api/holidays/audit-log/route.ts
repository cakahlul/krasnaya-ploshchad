import { holidaysService } from '@server/modules/holidays/holidays.service';
import { withLead } from '@server/modules/holidays/holidays-http';

export const dynamic = 'force-dynamic';

export const GET = withLead(async req => {
  const cursor = new URL(req.url).searchParams.get('cursor');
  return Response.json(await holidaysService.fetchAuditLog(cursor));
});
