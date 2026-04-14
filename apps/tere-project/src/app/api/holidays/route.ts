import { withAuth } from '@server/auth/with-auth';
import { holidaysService } from '@server/modules/holidays/holidays.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const year = new URL(req.url).searchParams.get('year');
  const holidays = await holidaysService.getHolidaysByYear(year ? +year : new Date().getFullYear());
  return Response.json(holidays);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { date, name } = body;
  if (!date || !name) return Response.json({ error: 'date and name are required' }, { status: 400 });
  const holiday = await holidaysService.createHoliday(date, name);
  return Response.json(holiday, { status: 201 });
});
