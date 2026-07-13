import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { withLead } from '@server/modules/wp-weight-config/wp-weight-config-http';

export const dynamic = 'force-dynamic';

export const GET = withLead(async () =>
  Response.json(await wpWeightConfigService.fetchAll()),
);

export const POST = withLead(async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const input = body && typeof body === 'object'
    ? body as Record<string, unknown>
    : {};
  const result = await wpWeightConfigService.create(
    input.effective_date,
    input.weights,
  );
  return Response.json(result.config, { status: result.created ? 201 : 200 });
});
