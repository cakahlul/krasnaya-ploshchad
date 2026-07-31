import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBlue2026Archive, type Blue2026ArchiveRow } from './blue-2026-parser';

const validRow = (overrides: Partial<Blue2026ArchiveRow> = {}): Blue2026ArchiveRow => ({
  sprintId: 'Sprint 42', sprintName: 'June sprint', sprintStartDate: '2026-06-01', sprintEndDate: '2026-06-14',
  developerIdentity: '  Ada@Example.COM ', developerName: 'Ada', tribe: 'Loan', mainRole: 'Backend Engineer',
  status: 'Y', spTotal: '8', spCompleted: '8',
  ...overrides,
});

test('parses Blue YYYY-MM-DD rows into immutable archive records allocated to the end-date month', () => {
  const result = parseBlue2026Archive([validRow()]);
  assert.deepEqual(result.rejections, []);
  assert.equal(result.sourceFormat, 'blue-2026');
  assert.equal(result.targetMonth, '2026-06-01');
  assert.deepEqual(result.records[0], {
    archivedMonth: '2026-06-01', sprintId: 'Sprint 42', sprintName: 'June sprint',
    sprintStartDate: '2026-06-01', sprintEndDate: '2026-06-14', boardIdSnapshot: null,
    boardNameSnapshot: null, reportingGroupSnapshot: 'Loan', developerIdentityRaw: '  Ada@Example.COM ',
    developerIdentityNormalized: 'ada@example.com', developerNameSnapshot: 'Ada', developerLevelRaw: null,
    developerLevelNormalized: null, mainRoleRaw: 'Backend Engineer', mainRoleNormalized: 'backend engineer',
    sourceTeam: 'Loan', sourceFormat: 'blue-2026', sourceStatus: 'Y', spTotal: 8, spCompleted: 8,
    spProvenance: null, rawRecord: validRow(),
  });
  assert.ok(Object.isFrozen(result.records[0]));
});

test('rejects Green and otherwise invalid Blue dates, impossible dates, and end dates before start dates', () => {
  const result = parseBlue2026Archive([
    validRow({ sprintStartDate: '6/1/2026' }),
    validRow({ sprintId: 'two', sprintStartDate: '2026-02-30' }),
    validRow({ sprintId: 'three', sprintStartDate: '2026-06-15', sprintEndDate: '2026-06-14' }),
  ]);
  assert.equal(result.records.length, 0);
  assert.deepEqual(result.rejections.flatMap(item => item.reasons), [
    'INVALID_BLUE_DATE_FORMAT', 'INVALID_DATE', 'SPRINT_END_BEFORE_START',
  ]);
});

test('normalizes blanks and dashes to null while preserving literal zero', () => {
  const result = parseBlue2026Archive([
    validRow({ spTotal: '   ', spCompleted: '0', tribe: 'Transaction', mainRole: ' QA ' }),
    validRow({ sprintId: 'Sprint 43', spTotal: ' - ', spCompleted: 0 }),
  ]);
  assert.deepEqual(result.rejections, []);
  assert.equal(result.records[0]?.spTotal, null);
  assert.equal(result.records[0]?.spCompleted, 0);
  assert.equal(result.records[1]?.spTotal, null);
  assert.equal(result.records[1]?.spCompleted, 0);
  assert.equal(result.records[0]?.reportingGroupSnapshot, 'Transaction');
  assert.equal(result.records[0]?.mainRoleNormalized, 'qa');
});

test('retains Status=N audit rows for the existing aggregate to exclude', () => {
  const result = parseBlue2026Archive([validRow({ status: 'N', spTotal: '13', spCompleted: '13' })]);
  assert.deepEqual(result.rejections, []);
  assert.equal(result.records[0]?.sourceStatus, 'N');
});

test('rejects fully blank rows, missing identity, duplicate developer-sprint-start, bad numeric values, and SP reconciliation failures', () => {
  const result = parseBlue2026Archive([
    {},
    validRow({ developerIdentity: '  ' }),
    validRow(),
    validRow({ developerIdentity: 'ada@example.com' }),
    validRow({ sprintId: 'bad-number', spTotal: '-1' }),
    validRow({ sprintId: 'bad-sp', spTotal: '3', spCompleted: '3.02' }),
  ]);
  assert.equal(result.records.length, 0);
  assert.deepEqual(result.rejections.flatMap(item => item.reasons), [
    'BLANK_ROW', 'MISSING_DEVELOPER_IDENTITY', 'DUPLICATE_DEVELOPER_SPRINT_START',
    'NONNEGATIVE_NUMBER_REQUIRED', 'SP_RECONCILIATION_FAILED',
  ]);
});
