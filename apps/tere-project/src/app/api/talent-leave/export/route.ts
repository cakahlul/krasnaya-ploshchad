import { withAuth } from '@server/auth/with-auth';
import { talentLeaveExportService } from '@server/modules/talent-leave/talent-leave-export.service';
import { userAccessService } from '@server/modules/user-access/user-access.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req, { user }) => {
  const role = user.email ? await userAccessService.getUserRole(user.email) : 'Member';
  if (role !== 'Lead') return Response.json({ message: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { startDate, endDate, accessToken } = body;
  if (!startDate || !endDate || !accessToken) {
    return Response.json({ message: 'startDate, endDate, and accessToken are required' }, { status: 400 });
  }
  try {
    const result = await talentLeaveExportService.exportToSpreadsheet({ startDate, endDate, accessToken });
    return Response.json(result);
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Export failed' }, { status: 400 });
  }
});
