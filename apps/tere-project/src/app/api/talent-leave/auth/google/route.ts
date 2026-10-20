import { withRole } from '@server/auth/with-role';
import { startGoogleOAuth } from '@server/lib/google-oauth-http';

export const dynamic = 'force-dynamic';
export const GET = withRole('Lead', async req => startGoogleOAuth(req));
