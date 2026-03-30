import { withAuth, type AuthedHandler } from './with-auth';

// Composes with withAuth. Requires Phase 3: user-access.service.ts.
export function withRole(role: string, handler: AuthedHandler) {
  return withAuth(async (req, context) => {
    // Dynamic import avoids a hard compile dependency before Phase 3 is complete.
    const { userAccessService } = await import(
      '@server/modules/user-access/user-access.service'
    );

    const userRole = await userAccessService.getUserRole(context.user.email!);

    if (userRole !== role) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    return handler(req, context);
  });
}
