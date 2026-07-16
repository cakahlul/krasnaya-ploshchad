#!/usr/bin/env node

// Live API / auth contract for Holiday audit trail (SLS-16618).
// Mirrors the pattern established in scripts/wp-weight-config.contract.mjs.
//
// Required env:
//   BASE_URL      - e.g. http://localhost:3000
//   LEAD_TOKEN    - bearer token for a user with role Lead
//   LEAD_EMAIL    - email of the LEAD_TOKEN identity (asserted as changed_by)
//   MEMBER_TOKEN  - bearer token for a non-Lead user
//   MEMBER_EMAIL  - email of the MEMBER_TOKEN identity (asserted as changed_by)
//
// Run: BASE_URL=... LEAD_TOKEN=... LEAD_EMAIL=... MEMBER_TOKEN=... MEMBER_EMAIL=... \
//      node scripts/holidays-audit.contract.mjs

import assert from 'node:assert/strict';

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const leadToken = required('LEAD_TOKEN');
const leadEmail = required('LEAD_EMAIL');
const memberToken = required('MEMBER_TOKEN');
const memberEmail = required('MEMBER_EMAIL');
const holidaysPath = '/api/holidays';
const bulkPath = `${holidaysPath}/bulk`;
const auditPath = `${holidaysPath}/audit-log`;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const createdIds = new Set();

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
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status} (${JSON.stringify(result.body)})`);
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label}: unexpected keys`);
}

function validDate(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${label}: date must be YYYY-MM-DD`);
}

function holiday(value, expectedDate, expectedName, label) {
  exactKeys(value, ['id', 'holiday_date', 'holiday_name', 'is_national_holiday'], label);
  assert.match(value.id, uuidPattern, `${label}.id: expected UUID`);
  validDate(value.holiday_date, `${label}.holiday_date`);
  if (expectedDate) assert.equal(value.holiday_date, expectedDate, `${label}.holiday_date: differs`);
  assert.equal(typeof value.holiday_name, 'string', `${label}.holiday_name: expected string`);
  assert(value.holiday_name.trim().length > 0, `${label}.holiday_name: expected non-empty string`);
  if (expectedName) assert.equal(value.holiday_name, expectedName, `${label}.holiday_name: differs`);
  assert.equal(value.is_national_holiday, true, `${label}.is_national_holiday: expected true`);
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
    holiday(value.new_value, null, null, `${label}.new_value`);
  } else {
    holiday(value.old_value, null, null, `${label}.old_value`);
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

// Scans the Lead audit log (paginated) for the first entry matching `predicate`.
// Used both for entity_id lookups (delete) and date/name lookups (bulk create,
// whose response does not echo back created IDs).
async function findAudit(predicate, label) {
  let cursor = null;
  for (let pageNumber = 1; pageNumber <= 200; pageNumber += 1) {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const result = await request(`${auditPath}${suffix}`, { token: leadToken });
    status(result, 200, `Lead audit page ${pageNumber}`);
    auditPage(result.body, `Lead audit page ${pageNumber}`);
    const found = result.body.items.find(predicate);
    if (found) return found;
    cursor = result.body.next_cursor;
    if (!cursor) break;
  }
  assert.fail(`${label}: matching audit event not found`);
}

function findCreateAuditByEntity(entityId, label) {
  return findAudit(item => item.action === 'create' && item.entity_id === entityId, label);
}

function findDeleteAuditByEntity(entityId, label) {
  return findAudit(item => item.action === 'delete' && item.entity_id === entityId, label);
}

function findCreateAuditByHoliday(date, name, label) {
  return findAudit(
    item => item.action === 'create' && item.new_value?.holiday_date === date && item.new_value?.holiday_name === name,
    label,
  );
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
  // --- GET /api/holidays/audit-log: auth + shape + pagination -----------------
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

  // --- POST /api/holidays: auth is NOT Lead-gated (any signed-in user) --------
  const createdDate1 = addDays(jakartaToday(), 3650);
  const createdName1 = `QA Contract Holiday A ${Date.now()}`;
  const createdDate2 = addDays(jakartaToday(), 3651);
  const createdName2 = `QA Contract Holiday B ${Date.now()}`;

  await expectError(
    holidaysPath,
    { method: 'POST', body: { date: createdDate1, name: createdName1 } },
    401,
    null,
    null,
    'Unauthenticated create',
  );

  for (const [label, field, body] of [
    ['Missing date', 'date', { name: createdName1 }],
    ['Missing name', 'name', { date: createdDate1 }],
  ]) {
    await expectError(holidaysPath, { method: 'POST', token: leadToken, body }, 400, 'VALIDATION_ERROR', field, label);
  }

  // Member (non-Lead) can create — mutation routes use withHolidayAuth, not withLead.
  const memberCreate = await request(holidaysPath, {
    method: 'POST',
    token: memberToken,
    body: { date: createdDate1, name: createdName1 },
  });
  status(memberCreate, 201, 'Member create');
  holiday(memberCreate.body, createdDate1, createdName1, 'Member create');
  createdIds.add(memberCreate.body.id);
  const memberCreateAudit = await findCreateAuditByEntity(memberCreate.body.id, 'Member create audit');
  assert.equal(memberCreateAudit.changed_by, memberEmail, 'Member create audit: changed_by must be actor email');
  assert.equal(memberCreateAudit.old_value, null, 'Member create audit: expected null old snapshot');
  holiday(memberCreateAudit.new_value, createdDate1, createdName1, 'Member create audit new snapshot');

  // Lead can also create — verifies changed_by tracks the actual actor, not a fixed role.
  const leadCreate = await request(holidaysPath, {
    method: 'POST',
    token: leadToken,
    body: { date: createdDate2, name: createdName2 },
  });
  status(leadCreate, 201, 'Lead create');
  holiday(leadCreate.body, createdDate2, createdName2, 'Lead create');
  createdIds.add(leadCreate.body.id);
  const leadCreateAudit = await findCreateAuditByEntity(leadCreate.body.id, 'Lead create audit');
  assert.equal(leadCreateAudit.changed_by, leadEmail, 'Lead create audit: changed_by must be actor email');

  // --- POST /api/holidays/bulk: auth + changed_by plumb -----------------------
  const bulkDate1 = addDays(jakartaToday(), 3652);
  const bulkName1 = `QA Contract Bulk A ${Date.now()}`;
  const bulkDate2 = addDays(jakartaToday(), 3653);
  const bulkName2 = `QA Contract Bulk B ${Date.now()}`;

  await expectError(
    bulkPath,
    { method: 'POST', body: [{ date: bulkDate1, name: bulkName1 }] },
    401,
    null,
    null,
    'Unauthenticated bulk create',
  );
  await expectError(bulkPath, { method: 'POST', token: leadToken, body: [] }, 400, 'VALIDATION_ERROR', null, 'Empty bulk create');

  const bulkCreate = await request(bulkPath, {
    method: 'POST',
    token: memberToken,
    body: [
      { date: bulkDate1, name: bulkName1 },
      { date: bulkDate2, name: bulkName2 },
    ],
  });
  status(bulkCreate, 201, 'Member bulk create');
  exactKeys(bulkCreate.body, ['message', 'count'], 'Member bulk create');
  assert.equal(typeof bulkCreate.body.message, 'string', 'Member bulk create: message expected string');
  assert.equal(bulkCreate.body.count, 2, 'Member bulk create: expected count 2');

  // Bulk response does not echo IDs — locate the created rows via the audit log instead.
  const bulkAudit1 = await findCreateAuditByHoliday(bulkDate1, bulkName1, 'Bulk item 1 audit');
  const bulkAudit2 = await findCreateAuditByHoliday(bulkDate2, bulkName2, 'Bulk item 2 audit');
  assert.equal(bulkAudit1.changed_by, memberEmail, 'Bulk item 1 audit: changed_by must be actor email');
  assert.equal(bulkAudit2.changed_by, memberEmail, 'Bulk item 2 audit: changed_by must be actor email');
  createdIds.add(bulkAudit1.entity_id);
  createdIds.add(bulkAudit2.entity_id);

  // --- DELETE /api/holidays/[id]: auth + changed_by plumb + immutability ------
  await expectError(`${holidaysPath}/${leadCreate.body.id}`, { method: 'DELETE' }, 401, null, null, 'Unauthenticated delete');

  // Delete is not Lead-gated either: Member deletes a holiday the Lead created.
  const memberDelete = await request(`${holidaysPath}/${leadCreate.body.id}`, { method: 'DELETE', token: memberToken });
  status(memberDelete, 204, 'Member delete of Lead-created future holiday');
  assert.equal(memberDelete.body, null, 'Member delete: expected empty body');
  createdIds.delete(leadCreate.body.id);
  const deleteAudit = await findDeleteAuditByEntity(leadCreate.body.id, 'Delete audit');
  assert.equal(deleteAudit.changed_by, memberEmail, 'Delete audit: changed_by must be deleting actor, not creator');
  holiday(deleteAudit.old_value, createdDate2, createdName2, 'Delete audit old snapshot');
  assert.equal(deleteAudit.new_value, null, 'Delete audit: expected null new snapshot');

  await expectError(
    `${holidaysPath}/${leadCreate.body.id}`,
    { method: 'DELETE', token: leadToken },
    404,
    'HOLIDAY_NOT_FOUND',
    null,
    'Delete already-deleted holiday',
  );
  await expectError(
    `${holidaysPath}/00000000-0000-4000-8000-000000000000`,
    { method: 'DELETE', token: leadToken },
    404,
    'HOLIDAY_NOT_FOUND',
    null,
    'Delete unknown holiday',
  );

  // Best-effort IMMUTABLE_CONFIG (409) check: needs a pre-existing non-future
  // holiday. Deliberately not created by this script — a past holiday can never
  // be cleaned up afterwards (delete would always 409), so we only probe
  // existing seed data and skip if none is available in this environment.
  const today = jakartaToday();
  const currentYear = Number(today.slice(0, 4));
  const yearList = await request(`${holidaysPath}?year=${currentYear}`, { token: leadToken });
  status(yearList, 200, 'Lead list current year (for immutable probe)');
  const pastHoliday = Array.isArray(yearList.body) ? yearList.body.find(h => h.holiday_date < today) : undefined;
  if (pastHoliday) {
    await expectError(
      `${holidaysPath}/${pastHoliday.id}`,
      { method: 'DELETE', token: leadToken },
      409,
      'IMMUTABLE_CONFIG',
      null,
      'Delete past holiday',
    );
  } else {
    console.warn('Skipped IMMUTABLE_CONFIG (409) check: no past holiday found in seed data for current year');
  }

  console.log('Holiday audit live contract: PASS');
}

try {
  await main();
} finally {
  for (const id of createdIds) {
    const cleanup = await request(`${holidaysPath}/${id}`, { method: 'DELETE', token: leadToken });
    assert([204, 404].includes(cleanup.status), `Cleanup ${id}: expected 204/404, got ${cleanup.status}`);
  }
}
