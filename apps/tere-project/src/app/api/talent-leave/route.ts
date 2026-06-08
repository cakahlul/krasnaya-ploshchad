import { withAuth } from '@server/auth/with-auth';
import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const { searchParams } = new URL(req.url);
  const filters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    team: searchParams.get('team') ?? undefined,
  };
  const records = await talentLeaveService.findAll(filters);
  const visibleRecords = caller?.isLead
    ? records
    : records.filter(record => record.memberId === caller?.memberId);
  return Response.json(visibleRecords);
});

export const POST = withAuth(async (req, { user }) => {
  const body = await req.json();
  try {
    const record = await talentLeaveService.create(body, user.email);
    return Response.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return Response.json({ message: 'Forbidden' }, { status: 403 });
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
});
