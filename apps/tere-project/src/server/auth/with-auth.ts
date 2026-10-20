import type { DecodedIdToken } from 'firebase-admin/auth';
import { membersService } from '@server/modules/members/members.service';
import { isAdmittedMember } from './access-policy';
import { auth } from '@server/lib/firebase-admin';

export type AuthedHandler = (
  req: Request,
  context: { user: DecodedIdToken; params?: Promise<Record<string, string>> },
) => Promise<Response>;

// Wraps an API route handler with Firebase token verification.
// Usage:  export const GET = withAuth(async (req, { user }) => { ... });
export function withAuth(handler: AuthedHandler) {
  return async (
    req: Request,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const user = await auth.verifyIdToken(token, true);
      const member = user.email ? await membersService.findByEmail(user.email) : null;
      if (!isAdmittedMember(user, member)) return Response.json({ message: 'Forbidden' }, { status: 403 });
      return handler(req, { user, params: context?.params });
    } catch {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  };
}
