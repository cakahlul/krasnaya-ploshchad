import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isCompleteSnapshot,
  isCompleteSnapshotPublication,
  snapshotChecksum,
  snapshotLogicalIdentity,
  type TeamReportingSnapshot,
  type TeamReportingSnapshotCoverage,
} from './report-snapshot';

function completeSnapshot(): { snapshot: TeamReportingSnapshot; coverage: TeamReportingSnapshotCoverage[] } {
  const rawJiraInput = [{ key: 'ABC-1' }, { key: 'ABC-2' }];
  const calculatedOutput = [{ member: 'Ada' }];
  return {
    snapshot: {
      id: 'snapshot-1',
      boardId: 42,
      boardName: 'Alpha',
      periodKind: 'scrum',
      sprintId: '123',
      sprintName: 'Sprint 123',
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-01-14',
      reportingMonth: '2026-01-01',
      rawJiraInput,
      calculatedOutput,
      rawInputCount: 2,
      calculatedOutputCount: 1,
      rawInputChecksum: snapshotChecksum(rawJiraInput),
      calculatedOutputChecksum: snapshotChecksum(calculatedOutput),
      integrityEvidence: { source: 'jira' },
      requiredSegmentCount: 2,
      capturedAt: new Date('2026-01-15T00:00:00Z'),
    },
    coverage: [
      { segmentKey: 'issues', rawInputCount: 2, calculatedOutputCount: 0, checksum: snapshotChecksum('issues') },
      { segmentKey: 'members', rawInputCount: 0, calculatedOutputCount: 1, checksum: snapshotChecksum('members') },
    ],
  };
}

function publicationFromComplete(): Parameters<typeof isCompleteSnapshotPublication>[0] {
  const { snapshot, coverage } = completeSnapshot();
  return {
    snapshot: {
      boardId: snapshot.boardId,
      boardName: snapshot.boardName,
      periodKind: snapshot.periodKind,
      sprintId: snapshot.sprintId,
      sprintName: snapshot.sprintName,
      periodStartDate: snapshot.periodStartDate,
      periodEndDate: snapshot.periodEndDate,
      reportingMonth: snapshot.reportingMonth,
      rawJiraInput: snapshot.rawJiraInput,
      calculatedOutput: snapshot.calculatedOutput,
      rawInputCount: snapshot.rawInputCount,
      calculatedOutputCount: snapshot.calculatedOutputCount,
      rawInputChecksum: snapshot.rawInputChecksum,
      calculatedOutputChecksum: snapshot.calculatedOutputChecksum,
      integrityEvidence: snapshot.integrityEvidence,
    },
    coverage,
  };
}

test('uses board and Jira sprint identity for Scrum snapshots', () => {
  assert.deepEqual(snapshotLogicalIdentity({
    boardId: 42,
    periodKind: 'scrum',
    sprintId: '123',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-14',
  }), { boardId: 42, periodKind: 'scrum', sprintId: '123' });
});

test('uses board and period dates for Kanban snapshots', () => {
  assert.deepEqual(snapshotLogicalIdentity({
    boardId: 42,
    periodKind: 'kanban',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-14',
  }), {
    boardId: 42,
    periodKind: 'kanban',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-14',
  });
});

test('rejects incomplete logical identities', () => {
  assert.throws(() => snapshotLogicalIdentity({
    boardId: 42,
    periodKind: 'scrum',
    sprintId: '',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-14',
  }), /SCRUM_SPRINT_ID_REQUIRED/);
  assert.throws(() => snapshotLogicalIdentity({
    boardId: 42,
    periodKind: 'scrum',
    sprintId: null,
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-14',
  }), /SCRUM_SPRINT_ID_REQUIRED/);
});

test('accepts a snapshot only when checksums, counts, and required coverage agree', () => {
  const { snapshot, coverage } = completeSnapshot();
  assert.equal(isCompleteSnapshot(snapshot, coverage), true);
});

test('rejects missing required metadata, raw/calculated values, checksums, and counts', () => {
  const { snapshot, coverage } = completeSnapshot();
  const invalid: Array<Partial<TeamReportingSnapshot>> = [
    { boardName: '' },
    { periodStartDate: '2026-01-15' },
    { periodEndDate: '2025-12-31' },
    { reportingMonth: '2026-02-01' },
    { rawJiraInput: null },
    { calculatedOutput: null },
    { integrityEvidence: null },
    { rawInputChecksum: 'not-a-sha256' },
    { calculatedOutputChecksum: 'not-a-sha256' },
    { rawInputCount: -1 },
    { calculatedOutputCount: 1.5 },
    { requiredSegmentCount: 0 },
  ];
  for (const change of invalid) assert.equal(isCompleteSnapshot({ ...snapshot, ...change }, coverage), false, Object.keys(change)[0]);
});

test('publication validation requires a complete candidate before persistence', () => {
  const publication = publicationFromComplete();
  assert.equal(isCompleteSnapshotPublication(publication), true);
  assert.equal(isCompleteSnapshotPublication({
    ...publication,
    coverage: publication.coverage.slice(0, 1),
  }), false);
  assert.equal(isCompleteSnapshotPublication({
    ...publication,
    snapshot: { ...publication.snapshot, rawJiraInput: null },
  }), false);
});

test('rejects a snapshot with changed output or incomplete coverage', () => {
  const { snapshot, coverage } = completeSnapshot();
  assert.equal(isCompleteSnapshot({ ...snapshot, calculatedOutput: [] }, coverage), false);
  assert.equal(isCompleteSnapshot(snapshot, coverage.slice(0, 1)), false);
  assert.equal(isCompleteSnapshot({ ...snapshot, reportingMonth: '2026-02-01' }, coverage), false);
  assert.equal(isCompleteSnapshot(snapshot, [{ ...coverage[0], checksum: 'not-a-sha256' }, coverage[1]]), false);
  assert.equal(isCompleteSnapshot(snapshot, [{ ...coverage[0], segmentKey: coverage[1].segmentKey }, coverage[1]]), false);
  assert.equal(isCompleteSnapshot(snapshot, [{ ...coverage[0], rawInputCount: 1 }, coverage[1]]), false);
  assert.equal(isCompleteSnapshot({ ...snapshot, rawInputCount: 3 }, coverage), false);
});
