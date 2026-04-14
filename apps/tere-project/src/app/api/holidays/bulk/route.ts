import { withAuth } from '@server/auth/with-auth';
import { holidaysService } from '@server/modules/holidays/holidays.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  if (!Array.isArray(body) || body.length === 0) {
    return Response.json({ error: 'body must be a non-empty array of { date, name }' }, { status: 400 });
  }
  for (const item of body) {
    if (!item.date || !item.name) {
      return Response.json({ error: 'each item must have date and name' }, { status: 400 });
    }
  }
  const result = await holidaysService.bulkCreateHolidays(body);
  return Response.json({ message: 'Holidays created successfully', count: result.count }, { status: 201 });
});
