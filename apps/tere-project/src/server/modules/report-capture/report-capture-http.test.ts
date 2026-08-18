import assert from 'node:assert/strict';
import test from 'node:test';
import { handleDeveloperCapturePost } from './report-capture-http';

const request = (body: unknown) => new Request('http://localhost/api/report-capture', {
  method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
});

test('rejects a missing or unbounded capture window before invoking capture', async () => {
  let invoked = false;
  const service = { capture: async () => { invoked = true; return { attempted: 0, successes: 0, failures: [] }; } };
  const response = await handleDeveloperCapturePost(request({ startDate: '2026-01-01', endDate: '2028-01-01' }), service);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Invalid capture window' });
  assert.equal(invoked, false);
});

test('returns the capture summary for a valid bounded window', async () => {
  const summary = { attempted: 2, successes: 1, failures: [{ board: 7, period: '42', reason: 'CAPTURE_PERIOD_FAILED' }] };
  const response = await handleDeveloperCapturePost(request({ startDate: '2026-01-01', endDate: '2026-01-31' }), { capture: async window => {
    assert.deepEqual(window, { startDate: '2026-01-01', endDate: '2026-01-31' });
    return summary;
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), summary);
});

test('accepts the exact 366-day boundary and rejects non-JSON bodies', async () => {
  let invoked = 0;
  const service = { capture: async () => { invoked += 1; return { attempted: 0, successes: 0, failures: [] }; } };
  const response = await handleDeveloperCapturePost(request({ startDate: '2026-01-01', endDate: '2027-01-02' }), service);
  assert.equal(response.status, 200);
  assert.equal(invoked, 1);
  const text = await handleDeveloperCapturePost(new Request('http://localhost/api/report-capture', {
    method: 'POST', body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-31' }),
    headers: { 'content-type': 'text/plain' },
  }), service);
  assert.equal(text.status, 400);
  const jsonx = await handleDeveloperCapturePost(new Request('http://localhost/api/report-capture', {
    method: 'POST', body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-31' }),
    headers: { 'content-type': 'application/jsonx' },
  }), service);
  assert.equal(jsonx.status, 400);
  const oversized = await handleDeveloperCapturePost(new Request('http://localhost/api/report-capture', {
    method: 'POST', body: `{"startDate":"2026-01-01","endDate":"2026-01-31","padding":"${'x'.repeat(9000)}"}`,
    headers: { 'content-type': 'application/json' },
  }), service);
  assert.equal(oversized.status, 400);
});

test('does not expose service failures', async () => {
  const response = await handleDeveloperCapturePost(request({ startDate: '2026-01-01', endDate: '2026-01-31' }), { capture: async () => { throw new Error('secret'); } });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: 'Unable to capture report data' });
});
