import { withAuth } from '@server/auth/with-auth';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';

export const dynamic = 'force-dynamic';

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
