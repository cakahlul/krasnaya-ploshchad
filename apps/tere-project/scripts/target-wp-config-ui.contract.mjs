#!/usr/bin/env node

// Live API contract for Target WP config Phase 1 UI-adjacent, NON-audit behavior
// (SLS-16673/16674 coverage that scripts/target-wp-config-audit.contract.mjs — SLS-16640,
// Phase 2 — does not exercise). Mirrors the helper style of wp-weight-config.contract.mjs /
// target-wp-config-audit.contract.mjs.
//
// Covers:
//   - CREATE-09: rate <= 0 rejected server-side (defense-in-depth) even when bypassing the FE,
//     for zero, negative, and a mixed dynamic-key payload where only one key is invalid.
//   - TBL-02/TBL-04: GET /api/target-wp-config list is sorted effective_date DESC and renders
//     arbitrary/dynamic rate keys, not just the default 4.
//
// Does NOT re-assert anything already covered by target-wp-config-audit.contract.mjs (audit
// entries, cursor pagination, cross-actor changed_by, past-date delete, unknown-id delete).
//
// RBAC (CREATE-10/DELETE-06): POST/DELETE are withLead as of Phase 1 — non-Lead (Member) gets
// 403 FORBIDDEN on both, same as the audit-log route. Asserted below with MEMBER_TOKEN.
//
// Required env:
//   BASE_URL     - e.g. http://localhost:3000
//   LEAD_TOKEN   - bearer token for a user with role Lead
//   MEMBER_TOKEN - bearer token for a non-Lead user
//
// Run: BASE_URL=... LEAD_TOKEN=... MEMBER_TOKEN=... node scripts/target-wp-config-ui.contract.mjs

import assert from 'node:assert/strict';

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const leadToken = required('LEAD_TOKEN');
const memberToken = required('MEMBER_TOKEN');
const configPath = '/api/target-wp-config';
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
  assert.equal(
    result.status,
    expected,
    `${label}: expected ${expected}, got ${result.status} (${JSON.stringify(result.body)})`,
  );
}

function expectRateRejection(result, invalidKey, label) {
  status(result, 400, label);
  assert.equal(result.body?.code, 'VALIDATION_ERROR', `${label}: expected VALIDATION_ERROR code`);
  assert.equal(result.body?.message, 'rate harus > 0', `${label}: expected exact service message`);
  assert(
    result.body?.fields && Object.hasOwn(result.body.fields, invalidKey),
    `${label}: expected fields.${invalidKey}`,
  );
  assert.equal(
    result.body.fields[invalidKey],
    'rate harus > 0',
    `${label}: expected exact field message`,
  );
}

async function main() {
  const baseDate = jakartaToday();

  // --- CREATE-09: rate <= 0 rejected server-side, bypassing any FE guard -------------------
  const zeroRateDate = addDays(baseDate, 3700);
  const zeroRateResult = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: zeroRateDate, rates: { junior: 0 } },
  });
  expectRateRejection(zeroRateResult, 'junior', 'Zero rate create');

  const negativeRateDate = addDays(baseDate, 3701);
  const negativeRateResult = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: negativeRateDate, rates: { medior: -5 } },
  });
  expectRateRejection(negativeRateResult, 'medior', 'Negative rate create');

  // Mixed dynamic-key payload: only ONE of several arbitrary keys is invalid — the service
  // must still reject the whole request (no partial-create), and must name the offending key,
  // not a generic "rates" field.
  const mixedRateDate = addDays(baseDate, 3702);
  const mixedRateResult = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: {
      effective_date: mixedRateDate,
      rates: { lead: 10, staff: 20, intern: 0, 'individual contributor': 5 },
    },
  });
  expectRateRejection(mixedRateResult, 'intern', 'Mixed dynamic-key rate create');

  // Confirm none of the rejected creates actually persisted (no orphan rows / no partial writes).
  const listAfterRejections = await request(configPath, { token: leadToken });
  status(listAfterRejections, 200, 'List after rejected creates');
  for (const rejectedDate of [zeroRateDate, negativeRateDate, mixedRateDate]) {
    assert(
      !listAfterRejections.body.some(row => row.effective_date === rejectedDate),
      `List after rejected creates: ${rejectedDate} must not have persisted`,
    );
  }

  // --- TBL-02 / TBL-04: list ordering + dynamic rate keys ----------------------------------
  const olderDate = addDays(baseDate, 3710);
  const newerDate = addDays(baseDate, 3720);

  const olderCreate = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: olderDate, rates: { junior: 1, medior: 2 } },
  });
  status(olderCreate, 201, 'Create older-dated row (2 rate keys)');
  createdIds.add(olderCreate.body.id);

  const newerCreate = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: newerDate, rates: { lead: 10, staff: 20, intern: 30 } },
  });
  status(newerCreate, 201, 'Create newer-dated row (disjoint 3 rate keys)');
  createdIds.add(newerCreate.body.id);

  const list = await request(configPath, { token: leadToken });
  status(list, 200, 'List after creates');
  const olderIndex = list.body.findIndex(row => row.id === olderCreate.body.id);
  const newerIndex = list.body.findIndex(row => row.id === newerCreate.body.id);
  assert(olderIndex !== -1, 'List: older row missing');
  assert(newerIndex !== -1, 'List: newer row missing');
  assert(
    newerIndex < olderIndex,
    'List: expected effective_date DESC ordering (newer row before older row)',
  );

  const olderRow = list.body[olderIndex];
  const newerRow = list.body[newerIndex];
  assert.deepEqual(
    Object.keys(olderRow.rates).sort(),
    ['junior', 'medior'],
    'Older row: expected its own 2-key rates shape, unaffected by the other row',
  );
  assert.deepEqual(
    Object.keys(newerRow.rates).sort(),
    ['intern', 'lead', 'staff'],
    'Newer row: expected its own disjoint 3-key rates shape',
  );

  // --- CREATE-10 / DELETE-06: non-Lead (Member) is forbidden on both mutation routes --------
  const memberCreateDate = addDays(baseDate, 3730);
  const memberCreateResult = await request(configPath, {
    method: 'POST',
    token: memberToken,
    body: { effective_date: memberCreateDate, rates: { junior: 5 } },
  });
  status(memberCreateResult, 403, 'Member create');
  assert.equal(memberCreateResult.body?.code, 'FORBIDDEN', 'Member create: expected FORBIDDEN code');

  const listAfterMemberCreate = await request(configPath, { token: leadToken });
  status(listAfterMemberCreate, 200, 'List after member create attempt');
  assert(
    !listAfterMemberCreate.body.some(row => row.effective_date === memberCreateDate),
    'List after member create attempt: must not have persisted',
  );

  // Lead creates a row for the Member-delete-forbidden check.
  const leadRowDate = addDays(baseDate, 3731);
  const leadRowCreate = await request(configPath, {
    method: 'POST',
    token: leadToken,
    body: { effective_date: leadRowDate, rates: { junior: 5 } },
  });
  status(leadRowCreate, 201, 'Lead create for member-delete check');
  createdIds.add(leadRowCreate.body.id);

  const memberDeleteResult = await request(`${configPath}/${leadRowCreate.body.id}`, {
    method: 'DELETE',
    token: memberToken,
  });
  status(memberDeleteResult, 403, 'Member delete');
  assert.equal(memberDeleteResult.body?.code, 'FORBIDDEN', 'Member delete: expected FORBIDDEN code');

  const listAfterMemberDelete = await request(configPath, { token: leadToken });
  status(listAfterMemberDelete, 200, 'List after member delete attempt');
  assert(
    listAfterMemberDelete.body.some(row => row.id === leadRowCreate.body.id),
    'List after member delete attempt: row must still exist (delete was forbidden)',
  );

  console.log('Target WP config UI (non-audit) live contract: PASS');
}

try {
  await main();
} finally {
  for (const id of createdIds) {
    const cleanup = await request(`${configPath}/${id}`, { method: 'DELETE', token: leadToken });
    assert([204, 404].includes(cleanup.status), `Cleanup ${id}: expected 204/404, got ${cleanup.status}`);
  }
}
