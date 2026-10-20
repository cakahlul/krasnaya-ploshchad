import { membersService } from '@server/modules/members/members.service';
import { canAccessProject } from '@server/auth/access-policy';
import { withAuth } from '@server/auth/with-auth';
import { sprintService } from '@server/modules/sprint/sprint.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, { user }) => {
  const member = await membersService.findByEmail(user.email!);
  const projects = await sprintService.fetchAllProject();
  return Response.json(projects.filter(project => canAccessProject(member ?? undefined, project.key)));
});
