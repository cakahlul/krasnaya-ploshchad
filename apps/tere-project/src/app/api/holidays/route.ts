import { withAuth } from '@server/auth/with-auth';
import { holidaysService } from '@server/modules/holidays/holidays.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const year = new URL(req.url).searchParams.get('year');
  const holidays = await holidaysService.getHolidaysByYear(year ? +year : new Date().getFullYear());
  return Response.json(holidays);
});
