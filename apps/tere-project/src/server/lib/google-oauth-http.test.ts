import assert from 'node:assert/strict';
import test from 'node:test';
import { startGoogleOAuth, handleGoogleOAuthCallback } from './google-oauth-http';

process.env.GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost/api/talent-leave/auth/google/callback';
process.env.GOOGLE_OAUTH_CLIENT_ID = 'test';

test('OAuth rejects missing or mismatched state before token exchange', async () => {
  let calls = 0;
  const exchange = async () => { calls++; return 'secret'; };
  for (const query of ['code=x', 'code=x&state=wrong']) {
    const response = await handleGoogleOAuthCallback(new Request(`http://localhost/api/talent-leave/auth/google/callback?${query}`), exchange);
    assert.equal(response.status, 400);
    assert.equal((await response.text()).includes('secret'), false);
  }
  assert.equal(calls, 0);
});

test('OAuth binds state to a cookie, clears it, and posts only to the configured origin', async () => {
  const start = startGoogleOAuth(new Request('http://localhost/api/report/productivity-summary/auth/google'));
  const { authUrl } = await start.json();
  const state = new URL(authUrl).searchParams.get('state');
  assert.match(state, /^[a-f0-9]{64}$/);
  const cookie = start.headers.get('set-cookie')!;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const request = new Request(`http://localhost/api/talent-leave/auth/google/callback?code=x&state=${state}`, { headers: { cookie: cookie.split(';')[0] } });
  const result = await handleGoogleOAuthCallback(request, async () => '</script><img src=x>');
  assert.equal(result.status, 200);
  assert.match(result.headers.get('set-cookie')!, /Max-Age=0/);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const html = await result.text();
  assert.match(html, /"http:\/\/localhost"/);
  assert.doesNotMatch(html, /<img|, "\*"/);
});
