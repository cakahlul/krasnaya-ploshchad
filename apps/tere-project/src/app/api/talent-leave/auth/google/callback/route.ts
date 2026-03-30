import { createOAuthClient } from '@server/lib/google-oauth.client';

export const dynamic = 'force-dynamic';

// PUBLIC route — no withAuth wrapper. Handles Google OAuth2 callback and postMessages token to opener.
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('<script>window.opener.postMessage({type:"GOOGLE_AUTH_ERROR",error:"No code provided"},"*");window.close();</script>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return new Response('<script>window.opener.postMessage({type:"GOOGLE_AUTH_ERROR",error:"No access token"},"*");window.close();</script>', {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<body>
<script>
  window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS", accessToken: ${JSON.stringify(accessToken)} }, "*");
  window.close();
</script>
</body>
</html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`<script>window.opener.postMessage({type:"GOOGLE_AUTH_ERROR",error:${JSON.stringify(message)}},"*");window.close();</script>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
