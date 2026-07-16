#!/usr/bin/env node

import assert from 'node:assert/strict';

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const leadToken = required('LEAD_TOKEN');
const memberToken = required('MEMBER_TOKEN');
const configPath = '/api/wp-weight-config';
const auditPath = `${configPath}/audit-log`;
const weightKeys = ['High', 'Low', 'Medium', 'Very Low'];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let createdId;
let createdDate;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
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
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}`);
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label}: unexpected keys`);
}

function validDate(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${label}: date must be YYYY-MM-DD`);
  const [year, month, day] = value.split('-').map(Number);
  assert.equal(
    new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10),
    value,
    `${label}: invalid calendar date`,
  );
}

function weights(value, expected, label) {
  exactKeys(value, weightKeys, label);
  for (const key of weightKeys) {
    assert.equal(typeof value[key], 'number', `${label}.${key}: expected number`);
    assert(Number.isFinite(value[key]), `${label}.${key}: expected finite number`);
    assert(value[key] > 0 && value[key] <= 100, `${label}.${key}: expected > 0 and <= 100`);
  }
  if (expected) assert.deepEqual(value, expected, `${label}: values differ`);
}

function config(value, expectedDate, expectedWeights, label) {
  exactKeys(value, ['id', 'effective_date', 'weights'], label);
  assert.equal(typeof value.id, 'string', `${label}.id: expected string`);
  assert(value.id.trim().length > 0, `${label}.id: expected non-empty string`);
  validDate(value.effective_date, `${label}.effective_date`);
  if (expectedDate) assert.equal(value.effective_date, expectedDate, `${label}: date differs`);
  weights(value.weights, expectedWeights, `${label}.weights`);
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
  exactKeys(
    value,
    ['id', 'entity_id', 'action', 'changed_by', 'old_value', 'new_value', 'changed_at'],
    label,
  );
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
}

async function findAudit(entityId, action) {
  let cursor = null;
  for (let pageNumber = 1; pageNumber <= 100; pageNumber += 1) {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const result = await request(`${auditPath}${suffix}`, { token: leadToken });
    status(result, 200, `Lead audit page ${pageNumber}`);
    auditPage(result.body, `Lead audit page ${pageNumber}`);
    const found = result.body.items.find(item => item.entity_id === entityId && item.action === action);
    if (found) return found;
    cursor = result.body.next_cursor;
    if (!cursor) break;
  }
  assert.fail(`Audit ${action}: event for ${entityId} not found`);
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

  const initial = await request(configPath, { token: leadToken });
  status(initial, 200, 'Lead list');
  assert(Array.isArray(initial.body), 'Lead list: expected array');
  initial.body.forEach((item, index) => config(item, null, null, `Lead list[${index}]`));
  for (let index = 1; index < initial.body.length; index += 1) {
    assert(
      initial.body[index - 1].effective_date >= initial.body[index].effective_date,
      'Lead list: expected effective_date descending',
    );
  }

  const occupied = new Set(initial.body.map(({ effective_date }) => effective_date));
  createdDate = addDays(jakartaToday(), 3650);
  while (occupied.has(createdDate)) createdDate = addDays(createdDate, 1);

  const validWeights = { 'Very Low': 0.0000001, Low: 1.25, Medium: 50.123456789, High: 100 };
  const differentWeights = { ...validWeights, Low: 1.5 };

  await expectError(configPath, {}, 401, null, null, 'Unauthenticated list');
  await expectError(configPath, { token: memberToken }, 403, null, null, 'Member list');
  await expectError(
    configPath,
    { method: 'POST', token: memberToken, body: { effective_date: createdDate, weights: validWeights } },
    403,
    null,
    null,
    'Member create',
  );
  await expectError(
    configPath,
    { method: 'POST', body: { effective_date: createdDate, weights: validWeights } },
    401,
    null,
    null,
    'Unauthenticated create',
  );

  for (const [label, field, body] of [
    ['Comma/string weight', 'weights', { effective_date: createdDate, weights: { ...validWeights, Low: '1,5' } }],
    ['Extra weight key', 'weights', { effective_date: createdDate, weights: { ...validWeights, Extreme: 1 } }],
    ['Invalid date', 'effective_date', { effective_date: '2025-02-29', weights: validWeights }],
  ]) {
    await expectError(configPath, { method: 'POST', token: leadToken, body }, 400, 'VALIDATION_ERROR', field, label);
  }

  await expectError(
    `${configPath}/effective?date=not-a-date`,
    { token: leadToken },
    400,
    'VALIDATION_ERROR',
    'date',
    'Invalid effective date',
  );
  await expectError(`${configPath}/effective?date=${createdDate}`, {}, 401, null, null, 'Unauthenticated effective');

  const before = await request(`${configPath}/effective?date=${createdDate}`, { token: memberToken });
  status(before, 200, 'Member effective before create');
  weights(before.body, null, 'Member effective before create');

  const created = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: createdDate, weights: validWeights },
  });
  status(created, 201, 'Lead create');
  if (typeof created.body?.id !== 'string' || created.body.id.trim().length === 0) {
    throw new Error(
      `Lead create: 201 returned no valid ID; possible orphan at ${createdDate}, clean it up manually`,
    );
  }
  createdId = created.body.id;
  config(created.body, createdDate, validWeights, 'Lead create');
  const createAudit = await findAudit(createdId, 'create');
  assert.deepEqual(createAudit.old_value, null, 'Create audit: expected null old snapshot');
  config(createAudit.new_value, createdDate, validWeights, 'Create audit new snapshot');
  assert.equal(createAudit.new_value.id, createdId, 'Create audit: config ID differs');

  const retry = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: createdDate, weights: validWeights },
  });
  status(retry, 200, 'Identical retry');
  config(retry.body, createdDate, validWeights, 'Identical retry');
  assert.equal(retry.body.id, createdId, 'Identical retry: expected original id');

  await expectError(
    configPath,
    { method: 'POST', token: leadToken, body: { effective_date: createdDate, weights: differentWeights } },
    409,
    'EFFECTIVE_DATE_CONFLICT',
    null,
    'Different same-date create',
  );

  const afterCreate = await request(`${configPath}/effective?date=${createdDate}`, { token: leadToken });
  status(afterCreate, 200, 'Lead effective after create');
  weights(afterCreate.body, validWeights, 'Lead effective after create');
  const memberAfterCreate = await request(`${configPath}/effective?date=${createdDate}`, { token: memberToken });
  status(memberAfterCreate, 200, 'Member effective after create');
  weights(memberAfterCreate.body, validWeights, 'Member effective after create');

  const listed = await request(configPath, { token: leadToken });
  status(listed, 200, 'Lead list after create');
  assert(Array.isArray(listed.body), 'Lead list after create: expected array');
  const dateMatches = listed.body.filter(({ effective_date }) => effective_date === createdDate);
  const idMatches = listed.body.filter(({ id }) => id === createdId);
  assert.equal(dateMatches.length, 1, 'Lead list after create: expected exactly one row for created date');
  assert.equal(idMatches.length, 1, 'Lead list after create: expected exactly one row for created ID');
  assert.equal(dateMatches[0], idMatches[0], 'Lead list after create: date and ID must identify the same row');
  config(dateMatches[0], createdDate, validWeights, 'Created list item');

  await expectError(`${configPath}/${createdId}`, { method: 'DELETE' }, 401, null, null, 'Unauthenticated delete');
  await expectError(
    `${configPath}/${createdId}`,
    { method: 'DELETE', token: memberToken },
    403,
    null,
    null,
    'Member delete',
  );

  const deleted = await request(`${configPath}/${createdId}`, { method: 'DELETE', token: leadToken });
  status(deleted, 204, 'Lead future delete');
  assert.equal(deleted.body, null, 'Lead future delete: expected empty body');
  const deletedId = createdId;
  createdId = undefined;
  const deleteAudit = await findAudit(deletedId, 'delete');
  config(deleteAudit.old_value, createdDate, validWeights, 'Delete audit old snapshot');
  assert.equal(deleteAudit.old_value.id, deletedId, 'Delete audit: config ID differs');
  assert.equal(deleteAudit.new_value, null, 'Delete audit: expected null new snapshot');

  await expectError(
    `${configPath}/${deletedId}`,
    { method: 'DELETE', token: leadToken },
    404,
    'CONFIG_NOT_FOUND',
    null,
    'Unknown delete',
  );

  const afterDelete = await request(`${configPath}/effective?date=${createdDate}`, { token: memberToken });
  status(afterDelete, 200, 'Member effective after delete');
  weights(afterDelete.body, before.body, 'Member effective after delete');

  console.log('WP weight config live contract: PASS');
}

try {
  await main();
} finally {
  if (createdId) {
    const cleanup = await request(`${configPath}/${createdId}`, { method: 'DELETE', token: leadToken });
    assert([204, 404].includes(cleanup.status), `Cleanup: expected 204/404, got ${cleanup.status}`);
  }
}
