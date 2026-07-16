import { holidaysService } from '@server/modules/holidays/holidays.service';
import { withHolidayAuth } from '@server/modules/holidays/holidays-http';

export const dynamic = 'force-dynamic';

export const DELETE = withHolidayAuth(async (_req, { params, user }) => {
  const { id } = await params!;
  await holidaysService.deleteHoliday(id, user.email!);
  return new Response(null, { status: 204 });
});
