import { isAdmittedMember, hasUniqueReportName } from './access-policy';
import { membersRepository } from '@server/modules/members/members.repository';
import { withAuth } from './with-auth';
import { auth } from '@server/lib/firebase-admin';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import { membersService } from '@server/modules/members/members.service';

export interface CallerIdentity {
  email: string;
  isLead: boolean;
  memberId?: string;
  fullName?: string;
  teams?: string[];
}

type Handler = (
  req: Request,
  context: { caller?: CallerIdentity; params?: Promise<Record<string, string>> },
) => Promise<Response>;

async function resolveCaller(email: string): Promise<CallerIdentity | undefined> {
  const member = await membersService.findByEmail(email);
  if (!member || !isAdmittedMember({ email, email_verified: true }, member)) return undefined;
  // shortcut: legacy report rows use names; deny ambiguous ownership until sources carry stable IDs.
  const uniqueName = hasUniqueReportName(member.fullName, await membersRepository.findAll());
  return {
    email,
    isLead: member?.isLead ?? false,
    // memberId here is the Jira accountId — natural key shared with talent_leave.memberId
    memberId: member?.jiraId ?? undefined,
    fullName: uniqueName ? member.fullName : undefined,
    teams: member.teams,
  };
}

export function withAuthOrApiKey(handler: Handler) {
  return async (
    req: Request,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const apiKey = req.headers.get('x-api-key');

    if (apiKey) {
      const entity = await apiKeysService.validateKey(apiKey);
      if (!entity) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
      }
      try {
        const user = await auth.getUserByEmail(entity.createdBy);
        if (user.disabled || !user.emailVerified || (user.tokensValidAfterTime && entity.createdAt.getTime() < Date.parse(user.tokensValidAfterTime))) {
          return Response.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const caller = await resolveCaller(entity.createdBy);
        if (!caller) return Response.json({ message: 'Forbidden' }, { status: 403 });
        return handler(req, { caller, params: context?.params });
      } catch {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    return withAuth(async (request, { user }) => {
      const caller = await resolveCaller(user.email!);
      if (!caller) return Response.json({ message: 'Forbidden' }, { status: 403 });
      return handler(request, { caller, params: context?.params });
    })(req, context);
  };
}
