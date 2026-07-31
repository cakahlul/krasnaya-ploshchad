import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ArchiveImportService,
  InMemoryArchiveImportPort,
} from './archive-import';
import type { ArchiveParseResult, NormalizedArchiveRecord } from './archive-import.types';

const record: NormalizedArchiveRecord = {
  archivedMonth: '2025-12-01', sourceFormat: 'green-2025',
  sprintId: 'sprint-1', sprintName: 'Sprint 1', sprintStartDate: '2025-12-01', sprintEndDate: '2025-12-14',
  boardIdSnapshot: 42, boardNameSnapshot: 'Loan Board', reportingGroupSnapshot: 'Loan',
  developerIdentityRaw: 'Historical@Example.com', developerIdentityNormalized: 'historical@example.com', developerNameSnapshot: 'Historical Member',
  developerLevelRaw: null, developerLevelNormalized: null, mainRoleRaw: null, mainRoleNormalized: null, sourceTeam: null, sourceStatus: 'Y',
  spTotal: 8, spCompleted: 8, spProvenance: 'source', rawRecord: {},
};

const parsed = (overrides: Partial<ArchiveParseResult> = {}): ArchiveParseResult => ({
  sourceFormat: 'green-2025',
  targetMonth: '2025-12-01',
  records: [record],
  rejections: [],
  ...overrides,
});

const approval = {
  operatorId: 'operator@example.com',
  dataOwnerApprovedBy: 'owner@example.com',
};

test('rejections preserve the target period and write rejection evidence with row reasons', async () => {
  const port = new InMemoryArchiveImportPort({
    watermark: '2025-11-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'old-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'old-batch' }],
  });
  const service = new ArchiveImportService(port);

  const result = await service.import(parsed({
    rejections: [{ rowIndex: 7, reasons: ['SP_TOTAL_INVALID'], evidence: { value: 'eight' } }],
  }), approval);

  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'PARSE_REJECTIONS');
  assert.deepEqual(await port.snapshot(), {
    watermark: '2025-11-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'old-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'old-batch' }],
  });
  assert.deepEqual(port.rejectionEvidence(), [{
    targetMonth: '2025-12-01',
    sourceFormat: 'green-2025',
    rejections: [{ rowIndex: 7, reasons: ['SP_TOTAL_INVALID'], evidence: { value: 'eight' } }],
    reason: 'PARSE_REJECTIONS',
    operatorId: 'operator@example.com',
    dataOwnerApprovedBy: 'owner@example.com',
  }]);
});

test('requires a recorded data-owner approval before it can replace a period', async () => {
  const port = new InMemoryArchiveImportPort();
  const service = new ArchiveImportService(port);

  const result = await service.import(parsed(), { operatorId: 'operator@example.com' });

  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'DATA_OWNER_APPROVAL_REQUIRED');
  assert.deepEqual(await port.snapshot(), { watermark: null, coverage: [], rows: [] });
  assert.equal(port.rejectionEvidence()[0]?.reason, 'DATA_OWNER_APPROVAL_REQUIRED');
});

test('empty imports preserve the period and write named evidence', async () => {
  const port = new InMemoryArchiveImportPort({
    watermark: '2025-12-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'existing-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'existing-batch' }],
  });
  const before = await port.snapshot();
  const result = await new ArchiveImportService(port).import(parsed({ records: [] }), approval);

  assert.deepEqual(result, { status: 'REJECTED', reason: 'EMPTY_ARCHIVE_IMPORT' });
  assert.deepEqual(await port.snapshot(), before);
  assert.equal(port.rejectionEvidence()[0]?.reason, 'EMPTY_ARCHIVE_IMPORT');
});

test('record month or source-format mismatch is a period no-op with row evidence', async () => {
  const port = new InMemoryArchiveImportPort({
    watermark: '2025-12-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'existing-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'existing-batch' }],
  });
  const before = await port.snapshot();
  const result = await new ArchiveImportService(port).import(parsed({
    records: [{ ...record, archivedMonth: '2025-11-01', sourceFormat: 'blue-2026' }],
  }), approval);

  assert.deepEqual(result, { status: 'REJECTED', reason: 'RECORD_CONTRACT_MISMATCH' });
  assert.deepEqual(await port.snapshot(), before);
  assert.deepEqual(port.rejectionEvidence()[0]?.rejections?.[0]?.reasons, [
    'ARCHIVED_MONTH_MISMATCH', 'SOURCE_FORMAT_MISMATCH',
  ]);
});

test('atomically replaces only the target period then advances coverage and watermark', async () => {
  const port = new InMemoryArchiveImportPort({
    watermark: '2025-11-01',
    coverage: [
      { archivedMonth: '2025-11-01', importBatchId: 'november-batch', rowCount: 1 },
      { archivedMonth: '2025-12-01', importBatchId: 'old-batch', rowCount: 1 },
    ],
    rows: [
      { ...record, archivedMonth: '2025-11-01', importBatchId: 'november-batch' },
      { ...record, archivedMonth: '2025-12-01', importBatchId: 'old-batch' },
    ],
  });
  const service = new ArchiveImportService(port);

  const result = await service.import(parsed({ records: [record, { ...record, sprintId: 'sprint-2' }] }), approval);

  assert.equal(result.status, 'IMPORTED');
  assert.deepEqual(result.reconciliation, {
    targetMonth: '2025-12-01', previousRowCount: 1, writtenRowCount: 2, replacedRowCount: 1,
  });
  assert.deepEqual(await port.snapshot(), {
    watermark: '2025-12-01',
    coverage: [
      { archivedMonth: '2025-11-01', importBatchId: 'november-batch', rowCount: 1 },
      { archivedMonth: '2025-12-01', importBatchId: result.importBatchId, rowCount: 2 },
    ],
    rows: [
      { ...record, archivedMonth: '2025-11-01', importBatchId: 'november-batch' },
      { ...record, archivedMonth: '2025-12-01', importBatchId: result.importBatchId },
      { ...record, sprintId: 'sprint-2', archivedMonth: '2025-12-01', importBatchId: result.importBatchId },
    ],
  });
});

test('does not duplicate effects when the same valid import is retried', async () => {
  const port = new InMemoryArchiveImportPort();
  const service = new ArchiveImportService(port);

  const first = await service.import(parsed(), approval);
  const second = await service.import(parsed(), approval);

  assert.equal(first.status, 'IMPORTED');
  assert.deepEqual(second, { status: 'IDEMPOTENT', importBatchId: first.importBatchId });
  assert.deepEqual(await port.snapshot(), {
    watermark: '2025-12-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: first.importBatchId, rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: first.importBatchId }],
  });
});

for (const operation of ['replaceTargetPeriod', 'upsertCoverage', 'advanceWatermark', 'writeImportedEvidence'] as const) {
test(`rolls back all state when ${operation} fails`, async () => {
  const port = new InMemoryArchiveImportPort({
    watermark: '2025-11-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'old-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'old-batch' }],
    failOn: operation,
  });
  const service = new ArchiveImportService(port);

  await assert.rejects(service.import(parsed(), approval), new RegExp(`${operation} failed`));
  assert.deepEqual(await port.snapshot(), {
    watermark: '2025-11-01',
    coverage: [{ archivedMonth: '2025-12-01', importBatchId: 'old-batch', rowCount: 1 }],
    rows: [{ ...record, archivedMonth: '2025-12-01', importBatchId: 'old-batch' }],
  });
  assert.deepEqual(port.writtenEvidence(), []);
});
}
