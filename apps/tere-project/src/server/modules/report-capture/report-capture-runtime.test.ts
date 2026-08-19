import assert from 'node:assert/strict';
import test from 'node:test';
import { isClosedSprint, isPeriodEndInWindow } from './report-capture-runtime';

test('period ownership uses its end date, including cross-month Scrum and Kanban periods', () => {
  assert.equal(isPeriodEndInWindow('2026-01-29', { startDate: '2026-02-01', endDate: '2026-02-28' }), false);
  assert.equal(isPeriodEndInWindow('2026-02-01', { startDate: '2026-02-01', endDate: '2026-02-28' }), true);
  assert.equal(isPeriodEndInWindow('2026-02-28', { startDate: '2026-02-01', endDate: '2026-02-28' }), true);
  assert.equal(isPeriodEndInWindow('2026-03-01', { startDate: '2026-02-01', endDate: '2026-02-28' }), false);
});

test('only closed Scrum sprints are eligible for capture', () => {
  assert.equal(isClosedSprint('closed'), true);
  assert.equal(isClosedSprint('CLOSED'), true);
  assert.equal(isClosedSprint('active'), false);
  assert.equal(isClosedSprint(undefined), false);
});
