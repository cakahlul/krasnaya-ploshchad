import assert from 'node:assert/strict';
import test from 'node:test';
import { transformBugs } from './bug-monitoring.service';

const jiraBug = (created: string, resolutiondate: string | null) => ({
  id: '1',
  key: 'INCF-711',
  fields: {
    summary: 'boom',
    status: { name: resolutiondate ? 'Done' : 'In Progress' },
    priority: { name: 'High' },
    assignee: null,
    created,
    updated: '2026-08-04T00:00:00.000Z',
    resolution: null,
    resolutiondate,
  },
}) as never;

const NOW = Date.parse('2026-08-04T00:00:00.000Z');

test('exposes the corrected close date and stops counting days at it', () => {
  const [bug] = transformBugs([jiraBug('2026-06-01T00:00:00.000Z', '2026-06-11')], NOW);

  assert.equal(bug.closedDate, '2026-06-11');
  assert.equal(bug.daysOpen, 10);
});

test('an open bug keeps accruing days up to now', () => {
  const [bug] = transformBugs([jiraBug('2026-08-01T00:00:00.000Z', null)], NOW);

  assert.equal(bug.closedDate, null);
  assert.equal(bug.daysOpen, 3);
});

test('a close date before creation reports zero days rather than a negative count', () => {
  const [bug] = transformBugs([jiraBug('2026-06-10T00:00:00.000Z', '2026-06-01')], NOW);

  assert.equal(bug.daysOpen, 0);
});
