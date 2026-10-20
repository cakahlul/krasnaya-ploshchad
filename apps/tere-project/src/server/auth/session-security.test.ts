import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { NextRequest } from 'next/server';
import { middleware } from '@src/middleware';
import { auth } from '@server/lib/firebase-admin';
import { membersService } from '@server/modules/members/members.service';

test('page gate verifies session cookies and rejects fabricated, revoked, and departed sessions', async () => {
  let revoked = true;
  let member = { email: 'member@amarbank.co.id', joinDate: '2025-01-01', resignDate: null as string | null };
  mock.method(auth, 'verifySessionCookie', async (_cookie: string, checkRevoked: boolean) => {
    assert.equal(checkRevoked, true);
    if (revoked) throw new Error('invalid');
    return { email: member.email, email_verified: true };
  });
  mock.method(membersService, 'findByEmail', async () => member);
  process.env.NEXT_PUBLIC_ALLOWED_DOMAIN = 'amarbank.co.id';
  const request = new NextRequest('http://localhost/dashboard', { headers: { cookie: '__session=fabricated' } });
  try {
    assert.equal((await middleware(request)).status, 307);
    revoked = false;
    assert.equal((await middleware(request)).status, 200);
    member = { ...member, resignDate: '2025-12-31' };
    assert.equal((await middleware(request)).status, 307);
  } finally { mock.restoreAll(); }
});
