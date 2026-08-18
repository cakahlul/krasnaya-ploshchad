import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePeriodIdentity, getKanbanPeriod, validateKanbanAnchor } from './period-identity';

test('derives a Kanban period from ten weekdays and owns it by period end month', () => {
  assert.deepEqual(getKanbanPeriod('2026-06-08', '2026-06-19'), { startDate: '2026-06-08', endDate: '2026-06-19' });
  assert.deepEqual(getKanbanPeriod('2026-06-08', '2026-06-05'), { startDate: '2026-05-25', endDate: '2026-06-05' });
  assert.deepEqual(getKanbanPeriod('2026-06-08', '2026-06-22'), { startDate: '2026-06-22', endDate: '2026-07-03' });
  assert.equal(resolvePeriodIdentity({ boardId: 7, isKanban: true, kanbanCycleStartDate: '2026-06-08', date: '2026-06-19' }).ownershipMonth, '2026-06-01');
});

test('uses complete sprint identity for Scrum', () => {
  assert.deepEqual(resolvePeriodIdentity({ boardId: 7, isKanban: false, sprintId: '42', startDate: '2026-06-01', endDate: '2026-06-12' }), {
    kind: 'scrum', boardId: 7, sprintId: '42', startDate: '2026-06-01', endDate: '2026-06-12', ownershipMonth: '2026-06-01',
  });
});

test('includes board and period dates in Kanban identity', () => {
  const first = resolvePeriodIdentity({ boardId: 7, isKanban: true, kanbanCycleStartDate: '2026-06-08', date: '2026-06-19' });
  const second = resolvePeriodIdentity({ boardId: 8, isKanban: true, kanbanCycleStartDate: '2026-06-08', date: '2026-06-22' });
  assert.deepEqual(first, { kind: 'kanban', boardId: 7, startDate: '2026-06-08', endDate: '2026-06-19', ownershipMonth: '2026-06-01' });
  assert.deepEqual(second, { kind: 'kanban', boardId: 8, startDate: '2026-06-22', endDate: '2026-07-03', ownershipMonth: '2026-07-01' });
});

test('invalid or missing Kanban anchors return machine-readable Jira fallback reasons', () => {
  assert.deepEqual(validateKanbanAnchor(undefined), { valid: false, jiraFallbackReason: 'KANBAN_ANCHOR_MISSING' });
  assert.deepEqual(validateKanbanAnchor('not-a-date'), { valid: false, jiraFallbackReason: 'KANBAN_ANCHOR_INVALID' });
  assert.deepEqual(resolvePeriodIdentity({ boardId: 7, isKanban: true, date: '2026-06-19' }), { kind: 'jira-fallback', jiraFallbackReason: 'KANBAN_ANCHOR_MISSING' });
});

test('accepts a valid weekend Kanban anchor', () => {
  assert.deepEqual(validateKanbanAnchor('2026-06-07'), { valid: true, anchorDate: '2026-06-07' });
});

test('falls back for malformed, empty, or reversed Scrum periods', () => {
  const cases = [
    { sprintId: null, startDate: '2026-06-01', endDate: '2026-06-12' },
    { sprintId: '  ', startDate: '2026-06-01', endDate: '2026-06-12' },
    { sprintId: '42', startDate: '2026-02-30', endDate: '2026-03-01' },
    { sprintId: '42', startDate: '2026-06-12', endDate: '2026-06-01' },
  ];
  for (const input of cases) assert.deepEqual(resolvePeriodIdentity({ boardId: 7, isKanban: false, ...input } as never), { kind: 'jira-fallback', jiraFallbackReason: 'SCRUM_PERIOD_INCOMPLETE' });
});
