import { withAuth } from '@server/auth/with-auth';
import { talentLeaveExportService } from '@server/modules/talent-leave/talent-leave-export.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req) => {
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
