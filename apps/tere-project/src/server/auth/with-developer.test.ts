import assert from 'node:assert/strict';
import test from 'node:test';
import { isDeveloperEmail, withDeveloper } from './with-developer';
import type { DecodedIdToken } from 'firebase-admin/auth';

const request = new Request('http://localhost/api/report-capture', { method: 'POST' });
const user = (email: string | undefined) => ({ email } as DecodedIdToken);

test('developer policy requires an exact configured account email', () => {
  assert.equal(isDeveloperEmail(' Dev@Example.com ', 'dev@example.com'), true);
  assert.equal(isDeveloperEmail('other@example.com', 'dev@example.com'), false);
  assert.equal(isDeveloperEmail('dev@example.com', undefined), false);
});

test('developer wrapper returns unauthorized, forbidden, and allows configured users', async () => {
  process.env.DEVELOPER_EMAILS = 'dev@example.com';
  const handler = withDeveloper(async () => Response.json({ ok: true }), authHandler => async (req, context) => {
    if (!context) return Response.json({ message: 'Unauthorized' }, { status: 401 });
    return authHandler(req, context);
  });
  assert.equal((await handler(request)).status, 401);

  const forbidden = withDeveloper(async () => Response.json({ ok: true }), authHandler =>
    (req) => authHandler(req, { user: user('other@example.com') }));
  assert.equal((await forbidden(request)).status, 403);

  const allowed = withDeveloper(async () => Response.json({ ok: true }), authHandler =>
    (req) => authHandler(req, { user: user('dev@example.com') }));
  assert.equal((await allowed(request)).status, 200);
});
