#!/usr/bin/env node

// Live API / auth contract for Target WP config audit trail (SLS-16640).
// Mirrors the pattern established in scripts/wp-weight-config.contract.mjs and
// scripts/holidays-audit.contract.mjs, adapted for Target WP's specifics:
//   - rates keys are open (not a fixed set) — only checked as plain object of numbers.
//   - POST/DELETE are NOT Lead-gated (any signed-in user; withAuth, not withLead).
//   - DELETE has no immutability guard — past-dated configs delete with 204, not 409.
//   - No unique constraint on effective_date — no idempotent-retry / conflict behavior to test.
//
// Required env:
//   BASE_URL      - e.g. http://localhost:3000
//   LEAD_TOKEN    - bearer token for a user with role Lead
//   MEMBER_TOKEN  - bearer token for a non-Lead user
//
// Actor emails are read from each token's JWT payload (no separate *_EMAIL env vars needed).
//
// Run: BASE_URL=... LEAD_TOKEN=... MEMBER_TOKEN=... \
//      node scripts/target-wp-config-audit.contract.mjs

import assert from 'node:assert/strict';

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const leadToken = required('LEAD_TOKEN');
const memberToken = required('MEMBER_TOKEN');
const leadEmail = decodeJwtEmail(leadToken, 'LEAD_TOKEN');
const memberEmail = decodeJwtEmail(memberToken, 'MEMBER_TOKEN');
const configPath = '/api/target-wp-config';
const auditPath = `${configPath}/audit-log`;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const createdIds = new Set();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function decodeJwtEmail(token, label) {
  const payload = token.split('.')[1];
  assert(payload, `${label}: expected a JWT with a payload segment`);
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  assert.equal(typeof decoded.email, 'string', `${label}: expected an email claim in the JWT payload`);
  return decoded.email;
}

function jakartaToday() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts()
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`${method} ${path}: response is not JSON (${response.status})`);
    }
  }
  return { status: response.status, body: parsed };
}

function status(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected ${expected}, got ${result.status} (${JSON.stringify(result.body)})`,
  );
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label}: unexpected keys`);
}

function validDate(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${label}: date must be YYYY-MM-DD`);
}

// Target WP rates keys are open (e.g. junior/medior/senior/individual contributor) —
// only assert plain-object-of-numbers, never an exact key set.
function rates(value, expected, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  const keys = Object.keys(value);
  assert(keys.length > 0, `${label}: expected at least one rate key`);
  for (const key of keys) {
    assert.equal(typeof value[key], 'number', `${label}.${key}: expected number`);
    assert(Number.isFinite(value[key]), `${label}.${key}: expected finite number`);
  }
  if (expected) assert.deepEqual(value, expected, `${label}: values differ`);
}

function config(value, expectedDate, expectedRates, label) {
  exactKeys(value, ['id', 'effective_date', 'rates'], label);
  assert.equal(typeof value.id, 'string', `${label}.id: expected string`);
  assert(value.id.trim().length > 0, `${label}.id: expected non-empty string`);
  validDate(value.effective_date, `${label}.effective_date`);
  if (expectedDate) assert.equal(value.effective_date, expectedDate, `${label}.effective_date: differs`);
  rates(value.rates, expectedRates, `${label}.rates`);
}

function auditCursor(value, lastItem, label) {
  assert.equal(typeof value, 'string', `${label}: expected string`);
  assert(value.length <= 512, `${label}: expected at most 512 characters`);
  assert.match(value, /^[A-Za-z0-9_-]+$/, `${label}: expected unpadded base64url`);
  const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  exactKeys(decoded, ['v', 'changed_at', 'id'], `${label} payload`);
  assert.equal(decoded.v, 1, `${label}: unsupported version`);
  assert.equal(decoded.changed_at, lastItem.changed_at, `${label}: changed_at differs from row 20`);
  assert.equal(decoded.id, lastItem.id, `${label}: id differs from row 20`);
  assert.equal(Buffer.from(JSON.stringify(decoded)).toString('base64url'), value, `${label}: non-canonical encoding`);
}

function auditEntry(value, label) {
  exactKeys(value, ['id', 'entity_id', 'action', 'changed_by', 'old_value', 'new_value', 'changed_at'], label);
  assert.match(value.id, uuidPattern, `${label}.id: expected UUID`);
  assert.match(value.entity_id, uuidPattern, `${label}.entity_id: expected UUID`);
  assert(['create', 'delete'].includes(value.action), `${label}.action: expected create/delete`);
  assert.equal(typeof value.changed_by, 'string', `${label}.changed_by: expected string`);
  assert(value.changed_by.trim().length > 0, `${label}.changed_by: expected non-empty string`);
  assert.match(
    value.changed_at,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/,
    `${label}.changed_at: expected UTC timestamp with six fractional digits`,
  );
  if (value.action === 'create') {
    assert.equal(value.old_value, null, `${label}.old_value: create must be null`);
    config(value.new_value, null, null, `${label}.new_value`);
  } else {
    config(value.old_value, null, null, `${label}.old_value`);
    assert.equal(value.new_value, null, `${label}.new_value: delete must be null`);
  }
}

function auditPage(value, label) {
  exactKeys(value, ['items', 'next_cursor'], label);
  assert(Array.isArray(value.items), `${label}.items: expected array`);
  assert(value.items.length <= 20, `${label}.items: expected at most 20 entries`);
  value.items.forEach((entry, index) => auditEntry(entry, `${label}.items[${index}]`));
  for (let index = 1; index < value.items.length; index += 1) {
    const previous = value.items[index - 1];
    const current = value.items[index];
    assert(
      previous.changed_at > current.changed_at
        || (previous.changed_at === current.changed_at && previous.id > current.id),
      `${label}.items: expected changed_at DESC, id DESC`,
    );
  }
  if (value.next_cursor !== null) {
    assert.equal(value.items.length, 20, `${label}: cursor requires 20 returned entries`);
    auditCursor(value.next_cursor, value.items[19], `${label}.next_cursor`);
  }
  if (value.items.length === 20) {
    assert(value.next_cursor !== null, `${label}: expected next_cursor for a full 20-item page`);
  }
}

async function findAudit(entityId, action, label) {
  let cursor = null;
  for (let pageNumber = 1; pageNumber <= 200; pageNumber += 1) {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const result = await request(`${auditPath}${suffix}`, { token: leadToken });
    status(result, 200, `Lead audit page ${pageNumber}`);
    auditPage(result.body, `Lead audit page ${pageNumber}`);
    const found = result.body.items.find(item => item.entity_id === entityId && item.action === action);
    if (found) return found;
    cursor = result.body.next_cursor;
    if (!cursor) break;
  }
  assert.fail(`${label}: audit ${action} event for ${entityId} not found`);
}

function error(value, code, field, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: expected error object`);
  exactKeys(value, 'fields' in value ? ['code', 'message', 'fields'] : ['code', 'message'], label);
  assert.equal(typeof value.code, 'string', `${label}.code: expected string`);
  assert.equal(typeof value.message, 'string', `${label}.message: expected string`);
  assert(value.message.length > 0, `${label}.message: expected non-empty string`);
  if ('fields' in value) {
    assert(value.fields && typeof value.fields === 'object' && !Array.isArray(value.fields), `${label}.fields: expected object`);
  }
  if (code) assert.equal(value.code, code, `${label}: wrong error code`);
  if (field) {
    assert(value.fields && Object.hasOwn(value.fields, field), `${label}.fields: expected ${field}`);
  }
}

async function expectError(path, options, expectedStatus, code, field, label) {
  const result = await request(path, options);
  status(result, expectedStatus, label);
  error(result.body, code, field, label);
}

async function main() {
  // --- GET /api/target-wp-config/audit-log: auth + shape + pagination --------
  await expectError(auditPath, {}, 401, null, null, 'Unauthenticated audit list');
  await expectError(auditPath, { token: memberToken }, 403, null, null, 'Member audit list');

  const invalidCursor = await request(`${auditPath}?cursor=not-a-cursor`, { token: leadToken });
  status(invalidCursor, 400, 'Malformed audit cursor');
  assert.deepEqual(invalidCursor.body, {
    code: 'VALIDATION_ERROR',
    message: 'Invalid audit cursor',
    fields: { cursor: 'Invalid cursor' },
  });
  const oversizedCursor = await request(`${auditPath}?cursor=${'a'.repeat(513)}`, { token: leadToken });
  status(oversizedCursor, 400, 'Oversized audit cursor');
  assert.deepEqual(oversizedCursor.body, invalidCursor.body);

  const initialAudit = await request(auditPath, { token: leadToken });
  status(initialAudit, 200, 'Lead audit list');
  auditPage(initialAudit.body, 'Lead audit list');

  // --- POST /api/target-wp-config: NOT Lead-gated (any signed-in user) -------
  const memberDate = addDays(jakartaToday(), 3650);
  const memberRates = { junior: 10, medior: 20, senior: 30, 'individual contributor': 5 };

  await expectError(
    configPath,
    { method: 'POST', body: { effective_date: memberDate, rates: memberRates } },
    401,
    null,
    null,
    'Unauthenticated create',
  );

  const memberCreate = await request(configPath, {
    method: 'POST',
    token: memberToken,
    body: { effective_date: memberDate, rates: memberRates },
  });
  status(memberCreate, 201, 'Member create');
  config(memberCreate.body, memberDate, memberRates, 'Member create');
  createdIds.add(memberCreate.body.id);
  const memberCreateAudit = await findAudit(memberCreate.body.id, 'create', 'Member create audit');
  assert.equal(memberCreateAudit.changed_by, memberEmail, 'Member create audit: changed_by must be actor email');
  assert.equal(memberCreateAudit.old_value, null, 'Member create audit: expected null old snapshot');
  config(memberCreateAudit.new_value, memberDate, memberRates, 'Member create audit new snapshot');

  // Lead can also create — verifies changed_by tracks the actual actor, not a fixed role.
  const leadDate = addDays(jakartaToday(), 3651);
  const leadRates = { junior: 11, medior: 21, senior: 31, 'individual contributor': 6 };
  const leadCreate = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: leadDate, rates: leadRates },
  });
  status(leadCreate, 201, 'Lead create');
  config(leadCreate.body, leadDate, leadRates, 'Lead create');
  createdIds.add(leadCreate.body.id);
  const leadCreateAudit = await findAudit(leadCreate.body.id, 'create', 'Lead create audit');
  assert.equal(leadCreateAudit.changed_by, leadEmail, 'Lead create audit: changed_by must be actor email');

  // --- DELETE /api/target-wp-config/[id]: NOT Lead-gated, no immutability ----
  await expectError(`${configPath}/${leadCreate.body.id}`, { method: 'DELETE' }, 401, null, null, 'Unauthenticated delete');

  // Cross-actor delete: Member deletes the config Lead created.
  const memberDelete = await request(`${configPath}/${leadCreate.body.id}`, { method: 'DELETE', token: memberToken });
  status(memberDelete, 204, 'Member delete of Lead-created config');
  assert.equal(memberDelete.body, null, 'Member delete: expected empty body');
  createdIds.delete(leadCreate.body.id);
  const deleteAudit = await findAudit(leadCreate.body.id, 'delete', 'Delete audit');
  assert.equal(deleteAudit.changed_by, memberEmail, 'Delete audit: changed_by must be deleting actor, not creator');
  config(deleteAudit.old_value, leadDate, leadRates, 'Delete audit old snapshot');
  assert.equal(deleteAudit.new_value, null, 'Delete audit: expected null new snapshot');

  // --- Past-dated config delete: no immutability guard, expect 204 (unlike Holiday's 409) ---
  const pastDate = addDays(jakartaToday(), -3650);
  const pastRates = { junior: 12, medior: 22, senior: 32, 'individual contributor': 7 };
  const pastCreate = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: pastDate, rates: pastRates },
  });
  status(pastCreate, 201, 'Lead create past-dated config');
  config(pastCreate.body, pastDate, pastRates, 'Lead create past-dated config');
  createdIds.add(pastCreate.body.id);

  const pastDelete = await request(`${configPath}/${pastCreate.body.id}`, { method: 'DELETE', token: leadToken });
  status(pastDelete, 204, 'Delete past-dated config (no immutability guard)');
  createdIds.delete(pastCreate.body.id);
  const pastDeleteAudit = await findAudit(pastCreate.body.id, 'delete', 'Past-dated delete audit');
  assert.equal(pastDeleteAudit.changed_by, leadEmail, 'Past-dated delete audit: changed_by must be actor email');
  config(pastDeleteAudit.old_value, pastDate, pastRates, 'Past-dated delete audit old snapshot');
  assert.equal(pastDeleteAudit.new_value, null, 'Past-dated delete audit: expected null new snapshot');

  // Delete of a non-existent id: route has no not-found branch — expect the same
  // 204/empty-body no-op behavior as a normal delete (deleteWithAudit returns null,
  // no audit row written). If this observed status differs, the assertion below
  // fails loudly rather than silently passing — treat a failure here as an open
  // question for BE-3, not a script bug.
  const unknownDelete = await request(
    `${configPath}/00000000-0000-4000-8000-000000000000`,
    { method: 'DELETE', token: leadToken },
  );
  status(unknownDelete, 204, 'Delete unknown id (expected no-op 204 per TRD; flag as open question if this fails)');
  assert.equal(unknownDelete.body, null, 'Delete unknown id: expected empty body');

  console.log('Target WP config audit live contract: PASS');
}

try {
  await main();
} finally {
  for (const id of createdIds) {
    const cleanup = await request(`${configPath}/${id}`, { method: 'DELETE', token: leadToken });
    assert([204, 404].includes(cleanup.status), `Cleanup ${id}: expected 204/404, got ${cleanup.status}`);
  }
}
