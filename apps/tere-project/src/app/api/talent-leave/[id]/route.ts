import { withAuth } from '@server/auth/with-auth';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, { params }) => {
  const { id } = await params!;
  try {
    const record = await talentLeaveService.findOne(id);
    return Response.json(record);
  } catch {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
});

export const PUT = withAuth(async (req, { params }) => {
  const { id } = await params!;
  const body = await req.json();
  try {
    const record = await talentLeaveService.update(id, body);
    return Response.json(record);
  } catch {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  const { id } = await params!;
  try {
    await talentLeaveService.remove(id);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
});
