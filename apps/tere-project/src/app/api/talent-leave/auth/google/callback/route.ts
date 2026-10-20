import { handleGoogleOAuthCallback } from '@server/lib/google-oauth-http';

export const dynamic = 'force-dynamic';
export const GET = (req: Request) => handleGoogleOAuthCallback(req);
