import { holidaysService } from '@server/modules/holidays/holidays.service';
import { withHolidayAuth } from '@server/modules/holidays/holidays-http';

export const dynamic = 'force-dynamic';

export const POST = withHolidayAuth(async (req, { user }) => {
  const body = await req.json();
  const result = await holidaysService.bulkCreateHolidays(body, user.email!);
  return Response.json({ message: 'Holidays created successfully', count: result.count }, { status: 201 });
});
