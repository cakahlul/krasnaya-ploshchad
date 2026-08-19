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

test('creates durable run evidence and counts created, changed, unchanged, and failed periods', async () => {
  const events: string[] = [];
  const failures: unknown[] = [];
  let completion: unknown;
  const result = await createDeveloperCaptureService({
    boards: async () => { events.push('boards'); return [{ boardId: 1, boardName: 'One' }]; },
    periods: async () => [period(1, 'created'), period(1, 'changed'), period(1, 'unchanged'), period(1, 'failed')],
    fetchJira: async current => current.sprintId === 'failed'
      ? Promise.reject(new Error('JIRA_DOWN'))
      : { rawInput: {}, segments: [{ segmentKey: 'report', value: [], count: 0 }] },
    calculate: async current => ({ calculatedOutput: { sprint: current.sprintId }, segments: [{ segmentKey: 'report', value: [], count: 0 }] }),
    repository: { publishWithOutcome: async publication => ({
      kind: publication.snapshot.sprintId === 'created' ? 'created' : publication.snapshot.sprintId === 'changed' ? 'replaced' : 'unchanged',
      snapshot: publication.snapshot,
    }) as never },
    runRepository: {
      create: async input => { events.push('create'); assert.deepEqual(input, { actor: 'developer@example.com', window: { startDate: '2026-01-01', endDate: '2026-01-31' } }); return { id: 'run-1' } as never; },
      recordFailure: async (_runId, failure) => { failures.push(failure); },
      complete: async (_runId, value) => { completion = value; return { id: 'run-1' } as never; },
    },
    now: (() => { const dates = [new Date(0), new Date(12)]; return () => dates.shift()!; })(),
  } as never).capture({ startDate: '2026-01-01', endDate: '2026-01-31' }, 'developer@example.com');

  assert.deepEqual(events.slice(0, 2), ['create', 'boards']);
  assert.deepEqual(failures, [{ boardId: 1, period: 'failed', reason: 'CAPTURE_PERIOD_FAILED' }]);
  assert.deepEqual(completion, { status: 'partial', attempted: 4, succeeded: 2, failed: 1, unchanged: 1 });
  assert.deepEqual(result, {
    runId: 'run-1', status: 'partial', attempted: 4, successes: 2, created: 1, changed: 1, unchanged: 1,
    failures: [{ board: 1, period: 'failed', reason: 'CAPTURE_PERIOD_FAILED' }],
    attempts: [
      { board: 1, period: 'created', status: 'success' }, { board: 1, period: 'changed', status: 'success' },
      { board: 1, period: 'unchanged', status: 'success' }, { board: 1, period: 'failed', reason: 'CAPTURE_PERIOD_FAILED', status: 'failure' },
    ], durationMs: 12,
  });
});

test('completes a zero-eligible run after successful discovery', async () => {
  let completion: unknown;
  const result = await createDeveloperCaptureService({
    boards: async () => [], periods: async () => [], fetchJira: async () => ({ rawInput: {}, segments: [] }), calculate: async () => ({ calculatedOutput: {}, segments: [] }),
    repository: { publishWithOutcome: async () => { throw new Error('unused'); } },
    runRepository: {
      create: async () => ({ id: 'run-0' } as never), recordFailure: async () => {},
      complete: async (_runId, value) => { completion = value; return { id: 'run-0' } as never; },
    },
  } as never).capture({ startDate: '2026-01-01', endDate: '2026-01-31' });
  assert.deepEqual(completion, { status: 'complete', attempted: 0, succeeded: 0, failed: 0, unchanged: 0 });
  assert.equal(result.status, 'complete');
});

test('preserves a safe discovery reason for invalid Kanban anchors', async () => {
  const result = await createDeveloperCaptureService({
    boards: async () => [{ boardId: 7, boardName: 'Kanban' }],
    periods: async () => { throw new Error('CAPTURE_KANBAN_ANCHOR_INVALID'); },
    fetchJira: async () => ({ rawInput: {}, segments: [] }),
    calculate: async () => ({ calculatedOutput: {}, segments: [] }),
    repository: { publish: async () => { throw new Error('unused'); } },
  }).capture({ startDate: '2026-01-01', endDate: '2026-01-31' });

  assert.deepEqual(result.failures, [{ board: 7, period: 'enumeration', reason: 'CAPTURE_KANBAN_ANCHOR_INVALID' }]);
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
