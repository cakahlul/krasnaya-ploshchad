import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeveloperCaptureService, type CapturePeriod } from './report-capture';
import { filterReportMembersForProject } from '@server/modules/reports/reports.service';

const period = (boardId: number, sprintId: string): CapturePeriod => ({
  boardId, boardName: `Board ${boardId}`, periodKind: 'scrum', sprintId,
  sprintName: `Sprint ${sprintId}`, periodStartDate: '2026-01-01', periodEndDate: '2026-01-14',
});

test('captures eligible periods independently and isolates malformed Jira responses', async () => {
  const published: string[] = [];
  const result = await createDeveloperCaptureService({
    boards: async () => [{ boardId: 1, boardName: 'One', isBugMonitoring: false }, { boardId: 2, boardName: 'Bug', isBugMonitoring: true }],
    periods: async () => [period(1, 'ok'), period(1, 'bad')],
    fetchJira: async p => p.sprintId === 'bad' ? ({ rawInput: null, segments: [] }) : ({ rawInput: { issues: [] }, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    calculate: async p => ({ calculatedOutput: { sprint: p.sprintId }, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    repository: { publish: async publication => { published.push(publication.snapshot.sprintId!); return { id: publication.snapshot.sprintId!, ...publication.snapshot, requiredSegmentCount: 1, capturedAt: new Date() }; } },
  }).capture({ startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.deepEqual(published, ['ok']);
  assert.equal(result.successes, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].period, 'bad');
});

test('requires a bounded window', async () => {
  const service = createDeveloperCaptureService({ boards: async () => [], periods: async () => [], fetchJira: async () => ({ rawInput: {}, segments: [] }), calculate: async () => ({ calculatedOutput: {}, segments: [] }), repository: { publish: async () => { throw new Error('unused'); } } });
  await assert.rejects(() => service.capture({ startDate: '2026-01-01', endDate: '2028-01-01' }), /CAPTURE_WINDOW_TOO_LARGE/);
});

test('rejects cross-board periods and impossible calendar dates', async () => {
  const published: string[] = [];
  const result = await createDeveloperCaptureService({
    boards: async () => [{ boardId: 1, boardName: 'One' }],
    periods: async () => [period(2, 'cross'), { ...period(1, 'bad-date'), periodStartDate: '2026-02-30' }],
    fetchJira: async () => ({ rawInput: {}, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    calculate: async () => ({ calculatedOutput: {}, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    repository: { publish: async publication => { published.push(publication.snapshot.sprintId!); return publication as never; } },
  }).capture({ startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.deepEqual(published, []);
  assert.equal(result.failures.length, 2);
  assert.deepEqual(result.failures.map(f => f.reason), ['CAPTURE_PERIOD_INVALID', 'CAPTURE_PERIOD_INVALID']);
});

test('passes the exact fetched Jira payload to calculation', async () => {
  const rawInput = { main: [{ id: 'same-object' }], planned: { BOARD: [{ id: 'planned-input' }] } };
  let calculatedInput: unknown;
  await createDeveloperCaptureService({
    boards: async () => [{ boardId: 1, boardName: 'One' }],
    periods: async () => [period(1, 'same')],
    fetchJira: async () => ({ rawInput, segments: [{ segmentKey: 'report', value: [], count: 0 }, { segmentKey: 'planned:BOARD', value: [], count: 0 }] }),
    calculate: async (_period, input) => {
      calculatedInput = input;
      return { calculatedOutput: {}, segments: [{ segmentKey: 'report', value: [], count: 0 }, { segmentKey: 'planned:BOARD', value: [], count: 0 }] };
    },
    repository: { publish: async publication => publication as never },
  }).capture({ startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.equal(calculatedInput, rawInput);
});

test('capture member selection matches normal report filtering', () => {
  const member = (fullName: string, isLead: boolean, teams: string[]) => ({ fullName, isLead, teams } as never);
  assert.deepEqual(
    filterReportMembersForProject([
      member('Developer', false, ['BOARD']), member('Lead', true, ['BOARD']), member('Other', false, ['OTHER']),
    ], 'board').map(item => item.fullName),
    ['Developer'],
  );
});

test('backfills 2026 ownership months independently with evidence on retries', async () => {
  const published: string[] = [];
  const service = createDeveloperCaptureService({
    boards: async () => [{ boardId: 1, boardName: 'One' }, { boardId: 2, boardName: 'Two' }],
    periods: async board => [{ ...period(board.boardId, `s${board.boardId}`), periodStartDate: '2025-12-29', periodEndDate: '2026-01-11' }],
    fetchJira: async current => current.boardId === 2
      ? Promise.reject(new Error('JIRA_DOWN'))
      : { rawInput: {}, segments: [{ segmentKey: 'issues', value: [], count: 0 }] },
    calculate: async () => ({ calculatedOutput: {}, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    repository: { publish: async publication => { published.push(publication.snapshot.sprintId!); return publication as never; } },
  });

  const first = await service.backfill2026();
  const second = await service.backfill2026();
  assert.equal(first.attempts.length, 2);
  assert.deepEqual(first.attempts.map(attempt => attempt.status), ['success', 'failure']);
  assert.equal(second.attempts.length, 2);
  assert.deepEqual(published, ['s1', 's1']);
});

test('backfill attempts every 2026 ownership month, board, and period independently', async () => {
  const published: string[] = [];
  let pass = 0;
  const service = createDeveloperCaptureService({
    boards: async () => [{ boardId: 1, boardName: 'One' }, { boardId: 2, boardName: 'Two' }],
    periods: async board => Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      return [
        { ...period(board.boardId, `scrum-${board.boardId}-${month}`), periodEndDate: `2026-${month}-14` },
        { ...period(board.boardId, `kanban-${board.boardId}-${month}`), periodKind: 'kanban', sprintId: null, sprintName: null, periodEndDate: `2026-${month}-28` },
      ];
    }).flat(),
    fetchJira: async current => {
      if (pass === 0 && current.boardId === 2 && current.sprintId?.endsWith('-06')) throw new Error('JIRA_DOWN');
      return { rawInput: { board: current.boardId, period: current.sprintId }, segments: [{ segmentKey: 'issues', value: [], count: 0 }] };
    },
    calculate: async () => ({ calculatedOutput: {}, segments: [{ segmentKey: 'issues', value: [], count: 0 }] }),
    repository: { publish: async publication => { published.push(`${publication.snapshot.boardId}:${publication.snapshot.periodEndDate}`); return publication as never; } },
  });

  const first = await service.backfill2026();
  pass = 1;
  const second = await service.backfill2026();
  assert.equal(first.attempted, 48);
  assert.equal(first.successes, 47);
  assert.equal(first.failures.length, 1);
  assert.equal(first.failures[0].board, 2);
  assert.equal(first.failures[0].period, 'scrum-2-06');
  assert.equal(first.attempts.length, 48);
  const firstKeys = first.attempts.map(attempt => `${attempt.board}:${attempt.period}`);
  assert.equal(new Set(firstKeys).size, 48);
  assert.equal(first.attempts.filter(attempt => attempt.status === 'failure').length, 1);
  assert.deepEqual(first.attempts.filter(attempt => attempt.status === 'failure').map(attempt => `${attempt.board}:${attempt.period}`), ['2:scrum-2-06']);
  assert.equal(first.attempts.filter(attempt => attempt.status === 'success').length, 47);
  assert.equal(second.attempted, 48);
  assert.equal(second.successes, 48);
  assert.equal(second.failures.length, 0);
  assert.equal(second.attempts.length, 48);
  assert.equal(new Set(second.attempts.map(attempt => `${attempt.board}:${attempt.period}`)).size, 48);
  assert.equal(second.attempts.filter(attempt => attempt.status === 'success').length, 48);
  assert.equal(published.length, 95);
  assert.equal(new Set(published.filter(item => item.startsWith('1:'))).size, 24);
  assert.equal(new Set(published.filter(item => item.startsWith('2:'))).size, 24);
});
