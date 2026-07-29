import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryProductivityArchiveRepository,
  aggregateArchiveMonth,
  routeProductivityMonth,
  type ArchiveDeveloperSprint,
} from './productivity-archive';

const row: ArchiveDeveloperSprint = {
  archivedMonth: '2025-12-01', importBatchId: 'batch-1', sprintId: 'sprint-1',
  sprintStartDate: '2025-12-01', sprintEndDate: '2025-12-14', boardIdSnapshot: 42,
  boardNameSnapshot: 'Loan Board', reportingGroupSnapshot: 'Loan',
  developerIdentityNormalized: 'historical@example.com', developerNameSnapshot: 'Historical Member',
  sourceStatus: 'Y', spTotal: 8,
};

test('covered archive wins over live and forces SP basis', async () => {
  const repository = new InMemoryProductivityArchiveRepository({ watermark: '2025-12-01', coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'batch-1', rowCount: 1 }], rows: [row] });
  const result = await routeProductivityMonth('2025-12-01', repository);
  assert.equal(result.source, 'archive');
  assert.equal(result.metricBasis, 'SP');
  assert.deepEqual(result.rows, [row]);
});

test('missing coverage inside watermark is partial, not zero', async () => {
  const repository = new InMemoryProductivityArchiveRepository({ watermark: '2025-12-01' });
  const result = await routeProductivityMonth('2025-11-01', repository);
  assert.equal(result.source, 'partial');
  assert.equal(result.failure?.reason, 'ARCHIVE_WATERMARK_GAP');
  assert.equal(result.rows, null);
});

test('newer uncovered month routes live', async () => {
  const repository = new InMemoryProductivityArchiveRepository({ watermark: '2025-12-01' });
  const result = await routeProductivityMonth('2026-01-01', repository);
  assert.equal(result.source, 'live');
  assert.equal(result.metricBasis, null);
});

test('coverage without rows is a named partial failure', async () => {
  const repository = new InMemoryProductivityArchiveRepository({ coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'batch-1', rowCount: 1 }] });
  const result = await routeProductivityMonth('2025-12-01', repository);
  assert.equal(result.source, 'partial');
  assert.equal(result.failure?.reason, 'ARCHIVE_COVERAGE_WITHOUT_ROWS');
});

test('coverage row-count mismatch is a distinct partial failure', async () => {
  const repository = new InMemoryProductivityArchiveRepository({
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'batch-1', rowCount: 2 }],
    rows: [row],
  });
  const result = await routeProductivityMonth('2025-12-01', repository);
  assert.equal(result.source, 'partial');
  assert.equal(result.metricBasis, 'SP');
  assert.equal(result.rows, null);
  assert.deepEqual(result.failure, {
    scope: 'productivity',
    reason: 'ARCHIVE_COVERAGE_ROW_COUNT_MISMATCH',
    expectedRowCount: 2,
    actualRowCount: 1,
  });
});

test('repository preserves immutable board and Group snapshots', async () => {
  const mutable = { ...row };
  const repository = new InMemoryProductivityArchiveRepository({ rows: [mutable] });
  mutable.boardNameSnapshot = 'Current Board Rename';
  const stored = await repository.findRows('2025-12-01', 'batch-1');
  assert.equal(stored[0]?.boardNameSnapshot, 'Loan Board');
  assert.equal(stored[0]?.reportingGroupSnapshot, 'Loan');
  assert.ok(Object.isFrozen(stored[0]));
});

test('covered import batch excludes stale same-month rows', async () => {
  const repository = new InMemoryProductivityArchiveRepository({
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'batch-1', rowCount: 1 }],
    rows: [row, { ...row, importBatchId: 'stale-batch', developerNameSnapshot: 'Stale Member' }],
  });
  const result = await routeProductivityMonth('2025-12-01', repository);
  assert.equal(result.source, 'archive');
  assert.deepEqual(result.rows, [row]);
});

test('historical-only identity counts only in months with contributing rows', () => {
  const aggregate = aggregateArchiveMonth([row, { ...row, sprintId: 'sprint-2', sourceStatus: 'N', spTotal: 13 }, { ...row, sprintId: 'sprint-3', developerIdentityNormalized: 'blank@example.com', spTotal: null }]);
  assert.equal(aggregate.activeMembers, 1);
  assert.equal(aggregate.spTotal, 8);
  assert.equal(aggregate.members[0]?.resignDate, null);
});

test('zero-SP identity is not an active member and does not change the total', () => {
  const aggregate = aggregateArchiveMonth([
    row,
    { ...row, developerIdentityNormalized: 'zero@example.com', spTotal: 0 },
  ]);
  assert.equal(aggregate.activeMembers, 1);
  assert.equal(aggregate.spTotal, 8);
  assert.deepEqual(aggregate.members.map(member => member.identity), ['historical@example.com']);
});
