import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { memberStatus } from './TeamMembersPage';

const modalSource = readFileSync(new URL('./MemberFormModal.tsx', import.meta.url), 'utf8');

test('a resign date marks a member resigned regardless of Jira account', () => {
  assert.equal(memberStatus({ jiraId: 'acc-1', resignDate: '2026-03-31' }).key, 'resigned');
  assert.equal(memberStatus({ jiraId: null, resignDate: '2026-03-31' }).key, 'resigned');
});

test('a member with no Jira account is historical only, not silently active', () => {
  const status = memberStatus({ jiraId: null, resignDate: null });
  assert.equal(status.key, 'historical');
  assert.match(status.explanation, /only appears in archived months/);
});

test('a member with a Jira account and no resign date is active', () => {
  assert.equal(memberStatus({ jiraId: 'acc-1', resignDate: null }).key, 'active');
});

test('the form sends plain calendar dates so the day cannot shift by timezone', () => {
  assert.match(modalSource, /joinDate\.format\('YYYY-MM-DD'\)/);
  assert.match(modalSource, /resignDate\.format\('YYYY-MM-DD'\)/);
  assert.doesNotMatch(modalSource, /joinDate\.toISOString\(\)/);
});

test('clearing the resign date sends null rather than dropping the field', () => {
  // `undefined` would be omitted from the payload and the stored resignation would survive.
  assert.match(modalSource, /resignDate: values\.resignDate \? values\.resignDate\.format\('YYYY-MM-DD'\) : null/);
});

test('the resign date cannot be set before the join date', () => {
  assert.match(modalSource, /Resign date cannot precede the join date/);
});
