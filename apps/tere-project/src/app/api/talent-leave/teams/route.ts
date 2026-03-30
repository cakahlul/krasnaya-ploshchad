import { withAuth } from '@server/auth/with-auth';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';

export const GET = withAuth(async () => {
  const teams = await talentLeaveService.findAllTeams();
  return Response.json(teams);
});
