import assert from 'node:assert/strict';
import { errorResponse, normalizeWpResponse } from './wp-weight-config-http';
import { WpWeightConfigError } from './wp-weight-config.service';

async function main() {
  for (const [input, status, code, message] of [
    [new Response(null, { status: 401 }), 401, 'UNAUTHORIZED', 'Unauthorized'],
    [new Response(null, { status: 403 }), 403, 'FORBIDDEN', 'Forbidden'],
    [new Response('database detail', { status: 503 }), 500, 'INTERNAL_SERVER_ERROR', 'Internal Server Error'],
  ] as const) {
    const response = normalizeWpResponse(input);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { code, message });
  }

  const internal = errorResponse(new Error('database detail'));
  assert.equal(internal.status, 500);
  assert.deepEqual(await internal.json(), {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal Server Error',
  });

  const invalidCursor = errorResponse(new WpWeightConfigError(
    'VALIDATION_ERROR',
    'Invalid audit cursor',
    400,
    { cursor: 'Invalid cursor' },
  ));
  assert.equal(invalidCursor.status, 400);
  assert.deepEqual(await invalidCursor.json(), {
    code: 'VALIDATION_ERROR',
    message: 'Invalid audit cursor',
    fields: { cursor: 'Invalid cursor' },
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
