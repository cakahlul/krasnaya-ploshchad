#!/usr/bin/env node

import assert from 'node:assert/strict';

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const leadToken = required('LEAD_TOKEN');
const memberToken = required('MEMBER_TOKEN');
const configPath = '/api/wp-weight-config';
const weightKeys = ['High', 'Low', 'Medium', 'Very Low'];
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
