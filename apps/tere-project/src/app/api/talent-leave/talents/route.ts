import { withAuth } from '@server/auth/with-auth';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';
import { isIsoDate, type EmploymentPeriod } from '@shared/utils/member-lifecycle.util';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  if ((startDate || endDate) && !(startDate && endDate)) {
    return Response.json({ message: 'startDate and endDate are both required' }, { status: 400 });
  }
  if (startDate && endDate && (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate > endDate)) {
    return Response.json({ message: 'startDate and endDate must be valid ISO dates in ascending order' }, { status: 400 });
  }
  const period: EmploymentPeriod | undefined = startDate && endDate ? { startDate, endDate } : undefined;
  const talents = await talentLeaveService.findAllTalents(period);
  return Response.json(talents);
});
