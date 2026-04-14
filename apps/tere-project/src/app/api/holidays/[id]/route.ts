import { withAuth } from '@server/auth/with-auth';
import { holidaysService } from '@server/modules/holidays/holidays.service';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth(async (_req, { params }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await holidaysService.deleteHoliday(id);
  return new Response(null, { status: 204 });
});
