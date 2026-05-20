import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';
import { teamMembers } from '@shared/constants/team-members';

export const dynamic = 'force-dynamic';

/**
 * POST /api/members/seed
 * One-time seed: writes hardcoded teamMembers, storing the legacy ID as `jiraId`
 * so talent-leave records keyed by Jira accountId continue to resolve.
 */
export const POST = withAuth(async () => {
  const results = await Promise.allSettled(
    teamMembers.map((member) =>
      membersService.create({
        jiraId: member.id,
        name: member.name,
        fullName: member.fullName,
        email: member.email,
        level: member.level,
        isLead: false,
        teams: member.team,
      }),
    ),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results
    .map((r, i) => ({ result: r, member: teamMembers[i] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, member }) => ({
      id: member.id,
      name: member.name,
      reason:
        (result as PromiseRejectedResult).reason?.message ?? 'Unknown error',
    }));

  return Response.json(
    { succeeded, failed },
    { status: failed.length > 0 ? 207 : 200 },
  );
});
