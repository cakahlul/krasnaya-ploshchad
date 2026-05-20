import { auth } from '@server/lib/firebase-admin';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import { membersService } from '@server/modules/members/members.service';

export interface CallerIdentity {
  email: string;
  isLead: boolean;
  memberId?: string;
  fullName?: string;
}

type Handler = (
  req: Request,
  context: { caller?: CallerIdentity; params?: Promise<Record<string, string>> },
) => Promise<Response>;

async function resolveCaller(email: string): Promise<CallerIdentity> {
  const member = await membersService.findByEmail(email);
  return {
    email,
    isLead: member?.isLead ?? false,
    // memberId here is the Jira accountId — natural key shared with talent_leave.memberId
    memberId: member?.jiraId ?? undefined,
    fullName: member?.fullName,
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
      const caller = await resolveCaller(entity.createdBy);
      return handler(req, { caller, params: context?.params });
    }

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const user = await auth.verifyIdToken(token);
      const caller = user.email ? await resolveCaller(user.email) : undefined;
      return handler(req, { caller, params: context?.params });
    } catch {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  };
}
