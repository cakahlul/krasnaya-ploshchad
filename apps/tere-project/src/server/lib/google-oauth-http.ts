import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createOAuthClient, getAuthUrl } from './google-oauth.client';

const COOKIE = 'tere_google_oauth_state';
const PATH = '/api/talent-leave/auth/google/callback';

function stateCookie(state: string, maxAge: number): string {
  return `${COOKIE}=${state}; Path=${PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function callbackOrigin(): string {
  return new URL(process.env.GOOGLE_OAUTH_REDIRECT_URI!).origin;
}

export function startGoogleOAuth(req: Request): Response {
  if (new URL(req.url).origin !== callbackOrigin()) return Response.json({ message: 'Invalid OAuth origin' }, { status: 400 });
  const state = randomBytes(32).toString('hex');
  return Response.json({ authUrl: getAuthUrl(state) }, {
    headers: { 'set-cookie': stateCookie(state, 600), 'cache-control': 'no-store' },
  });
}

export async function handleGoogleOAuthCallback(
  req: Request,
  exchange: (code: string) => Promise<string | null | undefined> = async code => (await createOAuthClient().getToken(code)).tokens.access_token,
): Promise<Response> {
  const url = new URL(req.url);
  const state = url.searchParams.get('state') ?? '';
  const cookie = req.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) ?? '';
  const headers: Record<string, string> = {
    'set-cookie': stateCookie('', 0),
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
  };
  if (url.origin !== callbackOrigin() || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(cookie)
    || !timingSafeEqual(Buffer.from(state), Buffer.from(cookie))) {
    return Response.json({ message: 'Invalid OAuth state' }, { status: 400, headers });
  }
  let payload: { type: string; accessToken?: string; error?: string };
  try {
    const code = url.searchParams.get('code');
    const token = code ? await exchange(code) : null;
    payload = token ? { type: 'GOOGLE_AUTH_SUCCESS', accessToken: token } : { type: 'GOOGLE_AUTH_ERROR', error: 'Authorization failed' };
  } catch {
    payload = { type: 'GOOGLE_AUTH_ERROR', error: 'Authorization failed' };
  }
  const nonce = randomBytes(16).toString('hex');
  const data = JSON.stringify(payload).replace(/</g, '\\u003c');
  return new Response(`<!doctype html><html><body><script nonce="${nonce}">if(window.opener)window.opener.postMessage(${data}, ${JSON.stringify(callbackOrigin())});window.close();</script></body></html>`, {
    headers: { ...headers, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'` },
  });
}
