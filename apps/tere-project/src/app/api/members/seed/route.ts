import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';
import { teamMembers } from '@shared/constants/team-members';

export const dynamic = 'force-dynamic';

/**
 * POST /api/members/seed
 * One-time migration: writes all hardcoded teamMembers into the Firestore `members` collection.
 * Uses the existing legacy ID as the Firestore document ID so existing talent-leave records
 * can be linked by memberId after migration.
 */
export const POST = withAuth(async () => {
  const results = await Promise.allSettled(
    teamMembers.map((member) =>
      membersService.createWithId(member.id, {
        name: member.name,
        fullName: member.fullName,
        email: member.email,
        level: member.level,
        teams: member.team,
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results
    .map((r, i) => ({ result: r, member: teamMembers[i] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, member }) => ({
      id: member.id,
      name: member.name,
      reason: (result as PromiseRejectedResult).reason?.message ?? 'Unknown error',
    }));

  return Response.json({ succeeded, failed }, { status: failed.length > 0 ? 207 : 200 });
});
