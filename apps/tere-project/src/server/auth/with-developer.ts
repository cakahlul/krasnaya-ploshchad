import { withAuth, type AuthedHandler } from './with-auth';

export function isDeveloperEmail(email: string | null | undefined, configured = process.env.DEVELOPER_EMAILS): boolean {
  if (!email || !configured) return false;
  const normalized = email.trim().toLowerCase();
  return configured.split(',').some(item => item.trim().toLowerCase() === normalized);
}

export type AuthWrapper = (handler: AuthedHandler) => (req: Request, context?: { params?: Promise<Record<string, string>> }) => Promise<Response>;

export function withDeveloper(handler: AuthedHandler, authWrapper: AuthWrapper = withAuth) {
  return authWrapper(async (req, context) => {
    if (!isDeveloperEmail(context.user.email)) return Response.json({ message: 'Forbidden' }, { status: 403 });
    return handler(req, context);
  });
}
