import { withAuth } from '@server/auth/with-auth';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const filters = {
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    team: searchParams.get('team') ?? undefined,
  };
  const records = await talentLeaveService.findAll(filters);
  return Response.json(records);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const record = await talentLeaveService.create(body);
  return Response.json(record, { status: 201 });
});
