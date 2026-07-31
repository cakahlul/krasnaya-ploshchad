import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGreen2025Archive } from './green-2025-parser';

const validRow = {
  sprintId: 'SPR-42', sprintName: 'Sprint 42', sprintStartDate: '2/17/2025', sprintEndDate: '3/2/2025',
  boardId: '42', boardName: 'Loan', reportingGroup: 'Loan', developerIdentity: ' Dev@Example.com ',
  developerName: 'Developer', developerLevel: 'Senior', mainRole: 'Engineer', sourceTeam: 'Loan',
  status: 'Y', spProduct: '3', spTechDebt: '2', spMeeting: '1', spTotal: '6', spCompleted: '5',
};

test('normalizes a valid Green row into its sprint end-month archive record', () => {
  const result = parseGreen2025Archive([validRow]);

  assert.deepEqual(result.rejections, []);
  assert.equal(result.targetMonth, '2025-03-01');
  assert.deepEqual(result.records, [{
    archivedMonth: '2025-03-01', sprintId: 'SPR-42', sprintName: 'Sprint 42',
    sprintStartDate: '2025-02-17', sprintEndDate: '2025-03-02', boardIdSnapshot: 42,
    boardNameSnapshot: 'Loan', reportingGroupSnapshot: 'Loan', developerIdentityRaw: ' Dev@Example.com ',
    developerIdentityNormalized: 'dev@example.com', developerNameSnapshot: 'Developer',
    developerLevelRaw: 'Senior', developerLevelNormalized: 'senior', mainRoleRaw: 'Engineer',
    mainRoleNormalized: 'engineer', sourceTeam: 'Loan', sourceFormat: 'green-2025', sourceStatus: 'Y',
    spTotal: 6, spCompleted: 5, spProvenance: 'green-2025', rawRecord: validRow,
  }]);
});

test('turns blanks and dashes into null without turning them into zero', () => {
  const result = parseGreen2025Archive([{ ...validRow, boardId: '-', status: '', spProduct: '', spTechDebt: '-', spMeeting: '', spTotal: '-', spCompleted: '' }]);

  assert.deepEqual(result.rejections, []);
  assert.equal(result.records[0]?.boardIdSnapshot, null);
  assert.equal(result.records[0]?.spTotal, null);
  assert.equal(result.records[0]?.spCompleted, null);
});

test('retains numeric zero and permits reconciliation differences within tolerance', () => {
  const result = parseGreen2025Archive([{ ...validRow, spProduct: '0', spTechDebt: '0', spMeeting: '0', spTotal: '0.0000005', spCompleted: '0' }]);

  assert.deepEqual(result.rejections, []);
  assert.equal(result.records[0]?.spTotal, 0.0000005);
});

test('rejects missing, blank, or dash developer names instead of falling back to identity', () => {
  const result = parseGreen2025Archive([
    { ...validRow, developerName: undefined },
    { ...validRow, developerName: '   ' },
    { ...validRow, developerName: '-' },
  ]);

  assert.deepEqual(result.records, []);
  assert.deepEqual(result.rejections.map(item => item.reasons), [
    ['MISSING_DEVELOPER_NAME'], ['MISSING_DEVELOPER_NAME'], ['MISSING_DEVELOPER_NAME'],
  ]);
});

test('rejects completed SP above total outside tolerance', () => {
  const rejected = parseGreen2025Archive([{ ...validRow, spCompleted: '6.000002' }]);
  const accepted = parseGreen2025Archive([{ ...validRow, spCompleted: '6.0000005' }]);

  assert.deepEqual(rejected.records, []);
  assert.deepEqual(rejected.rejections[0]?.reasons, ['SP_COMPLETED_EXCEEDS_TOTAL']);
  assert.deepEqual(accepted.rejections, []);
});

test('retains Status=N for audit while marking it noncontributing', () => {
  const result = parseGreen2025Archive([{ ...validRow, status: 'N' }]);

  assert.deepEqual(result.rejections, []);
  assert.equal(result.records[0]?.sourceStatus, 'N');
});

test('rejects the full input for duplicate identity, sprint, and start date', () => {
  const result = parseGreen2025Archive([validRow, { ...validRow, developerIdentity: 'dev@example.com' }]);

  assert.deepEqual(result.records, []);
  assert.equal(result.rejections[0]?.reasons.includes('DUPLICATE_DEVELOPER_SPRINT_START'), true);
});

test('rejects Green dates outside M/D/YYYY, non-real dates, reversed dates, negative or nonnumeric values, and SP reconciliation mismatches', () => {
  const result = parseGreen2025Archive([
    { ...validRow, sprintStartDate: '2025-02-17' },
    { ...validRow, sprintStartDate: '2/30/2025' },
    { ...validRow, sprintStartDate: '3/4/2025', sprintEndDate: '3/2/2025' },
    { ...validRow, spProduct: '-1' },
    { ...validRow, spProduct: 'many' },
    { ...validRow, spTotal: '5' },
  ]);

  assert.deepEqual(result.records, []);
  assert.deepEqual(result.rejections.map(item => item.reasons), [
    ['INVALID_SPRINT_START_DATE'], ['INVALID_SPRINT_START_DATE'], ['SPRINT_END_BEFORE_START'],
    ['NEGATIVE_SP_PRODUCT'], ['INVALID_SP_PRODUCT'], ['SP_TOTAL_RECONCILIATION_MISMATCH'],
  ]);
});

test('rejects a fully blank row and an absent identity', () => {
  const result = parseGreen2025Archive([{}, { ...validRow, developerIdentity: '  ' }]);

  assert.deepEqual(result.records, []);
  assert.deepEqual(result.rejections.map(item => item.reasons), [['BLANK_ROW'], ['MISSING_DEVELOPER_IDENTITY']]);
});
