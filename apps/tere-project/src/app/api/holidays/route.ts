import { holidaysService } from '@server/modules/holidays/holidays.service';
import { withHolidayAuth } from '@server/modules/holidays/holidays-http';

export const dynamic = 'force-dynamic';

export const GET = withHolidayAuth(async (req) => {
  const year = new URL(req.url).searchParams.get('year');
  const holidays = await holidaysService.getHolidaysByYear(year ? +year : new Date().getFullYear());
  return Response.json(holidays);
});

export const POST = withHolidayAuth(async (req, { user }) => {
  const body = await req.json();
  const { date, name } = body;
  const holiday = await holidaysService.createHoliday(date, name, user.email!);
  return Response.json(holiday, { status: 201 });
});
