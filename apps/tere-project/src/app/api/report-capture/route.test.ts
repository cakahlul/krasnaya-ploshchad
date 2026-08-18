import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeveloperCapturePost } from './route';
import type { DecodedIdToken } from 'firebase-admin/auth';

const request = new Request('http://localhost/api/report-capture', {
  method: 'POST', body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-31' }),
  headers: { 'content-type': 'application/json' },
});
const auth = (email?: string) => ({ email } as DecodedIdToken);

test('route returns the capture summary for an authorized developer', async () => {
  process.env.DEVELOPER_EMAILS = 'dev@example.com';
  const post = createDeveloperCapturePost({ capture: async () => ({ attempted: 1, successes: 1, failures: [] }) }, handler =>
    (req) => handler(req, { user: auth('dev@example.com') }));
  const response = await post(request);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { attempted: 1, successes: 1, failures: [] });
});
