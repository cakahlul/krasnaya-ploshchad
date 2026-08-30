import assert from 'node:assert/strict';
import test from 'node:test';
import type { BoardResponse } from '@shared/types/board.types';
import type { GetReportResponseDto } from '@shared/types/report.types';
import type { TeamReportingSnapshot } from '@server/modules/report-snapshots/report-snapshot';
import { metadataFromResolution } from '@server/modules/report-source-resolver/report-source-resolver';
import { resolveTeamReport, type TeamReportingSourcePorts } from './team-report-source-resolver';

const board: BoardResponse = {
  id: 'board-row-7',
  boardId: 7,
  name: 'Team Alpha',
  shortName: 'ALPHA',
  isKanban: false,
  isBugMonitoring: false,
};

const report = {
  issues: [],
  totalWeightPointsProduct: 0,
  totalWeightPointsTechDebt: 0,
  productPercentage: '0.00%',
  techDebtPercentage: '0.00%',
  averageProductivity: '0.00%',
} satisfies GetReportResponseDto;

function snapshot(output: unknown = report): TeamReportingSnapshot {
  return {
    id: 'snapshot-7-42',
    boardId: 7,
    boardName: 'Team Alpha',
    periodKind: 'scrum',
    sprintId: '42',
    sprintName: 'Sprint 42',
    periodStartDate: '2026-07-01',
    periodEndDate: '2026-07-14',
    reportingMonth: '2026-07-01',
    rawJiraInput: { main: [], planned: {} },
    calculatedOutput: output,
    rawInputCount: 0,
    calculatedOutputCount: 1,
    rawInputChecksum: 'raw',
    calculatedOutputChecksum: 'calculated',
    integrityEvidence: { source: 'jira' },
    requiredSegmentCount: 1,
    capturedAt: new Date('2026-07-15T01:02:03.000Z'),
  };
}

function ports(overrides: Partial<TeamReportingSourcePorts> = {}): TeamReportingSourcePorts {
  return {
    findBoards: async () => [board],
    findSprints: async () => [],
    findSnapshot: async () => snapshot(),
    generateSprintReport: async () => report,
    generateDateRangeReport: async () => report,
    ...overrides,
  };
}

test('returns the complete captured sprint without calling live Jira', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({ generateSprintReport: async () => { liveCalls++; return report; } }),
  );

  assert.equal(result.source, 'snapshot');
  assert.equal(result.value, report);
  assert.equal(liveCalls, 0);
  assert.deepEqual(metadataFromResolution(result), {
    source: 'snapshot',
    coverage: { status: 'complete', expected: 1, covered: 1 },
    fallback: false,
    reason: null,
    warning: null,
    attemptedSources: [{ source: 'snapshot', detail: null }],
    snapshotTimestamp: '2026-07-15T01:02:03.000Z',
  });
});

test('uses normal live Jira when the selected snapshot does not exist', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshot: async () => null,
      generateSprintReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(result.value, report);
  assert.equal(liveCalls, 1);
  const metadata = metadataFromResolution(result);
  assert.equal(metadata.fallback, false);
  assert.equal(metadata.coverage.status, 'complete');
  assert.equal(metadata.reason, 'SNAPSHOT_NOT_FOUND');
  assert.equal(metadata.warning, null);
});

test('keeps Jira fallback warning when stored snapshot data is invalid', async () => {
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshotStatus: async () => ({ status: 'invalid' }),
      generateSprintReport: async () => report,
    }),
  );

  assert.equal(result.source, 'jira');
  const metadata = metadataFromResolution(result);
  assert.equal(metadata.fallback, true);
  assert.equal(metadata.coverage.status, 'fallback');
  assert.equal(metadata.reason, 'SNAPSHOT_INCOMPLETE_OR_CORRUPT');
  assert.equal(metadata.warning, 'Using Jira after stored source fallback');
});

test('keeps Jira fallback warning when snapshot lookup fails', async () => {
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshotStatus: async () => { throw new Error('snapshot database unavailable'); },
      generateSprintReport: async () => report,
    }),
  );

  assert.equal(result.source, 'jira');
  const metadata = metadataFromResolution(result);
  assert.equal(metadata.fallback, true);
  assert.equal(metadata.coverage.status, 'fallback');
  assert.equal(metadata.reason, 'SNAPSHOT_LOOKUP_FAILED');
  assert.equal(metadata.warning, 'Using Jira after stored source fallback');
});

test('does not serve a malformed captured report', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshot: async () => snapshot({ notAReport: true }),
      generateSprintReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(liveCalls, 1);
  assert.equal(metadataFromResolution(result).reason, 'SNAPSHOT_REPORT_INVALID');
});

test('does not serve a snapshot with malformed captured Jira input', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshot: async () => ({ ...snapshot(), rawJiraInput: { malformed: true } }),
      generateSprintReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(liveCalls, 1);
  assert.equal(metadataFromResolution(result).reason, 'SNAPSHOT_INPUT_INVALID');
});

test('restricts snapshot lookup to the requested project board IDs', async () => {
  const beta: BoardResponse = { ...board, id: 'board-row-8', boardId: 8, name: 'Team Beta', shortName: 'BETA' };
  const lookedUp: number[] = [];
  const result = await resolveTeamReport(
    { project: 'ALPHA,BETA', sprint: '42', boardIds: [8] },
    ports({
      findBoards: async () => [board, beta],
      findSnapshot: async identity => {
        lookedUp.push(identity.boardId);
        return { ...snapshot(), boardId: identity.boardId, boardName: identity.boardId === 8 ? 'Team Beta' : 'Team Alpha' };
      },
    }),
  );

  assert.equal(result.source, 'snapshot');
  assert.deepEqual(lookedUp, [8]);
});

test('falls back when the snapshot repository returns a different logical identity', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42' },
    ports({
      findSnapshot: async () => ({ ...snapshot(), boardId: 8 }),
      generateSprintReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(liveCalls, 1);
  assert.equal(metadataFromResolution(result).reason, 'SNAPSHOT_IDENTITY_MISMATCH');
});

test('applies an epic filter from stored input without fetching live Jira', async () => {
  let liveCalls = 0;
  let recalculationCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42', epicId: 'EPIC-1' },
    ports({
      generateSprintReport: async (_sprint, _project, epicId, rawDataOverride) => {
        assert.equal(epicId, 'EPIC-1');
        if (rawDataOverride === undefined) liveCalls++;
        else recalculationCalls++;
        return report;
      },
    }),
  );

  assert.equal(result.source, 'snapshot');
  assert.equal(liveCalls, 0);
  assert.equal(recalculationCalls, 1);
});

test('resolves a Kanban report from Monday-Sunday snapshots', async () => {
  const kanban: BoardResponse = {
    ...board,
    boardId: 9,
    name: 'Kanban Team',
    shortName: 'KANBAN',
    isKanban: true,
    kanbanCycleStartDate: undefined,
  };
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'KANBAN', startDate: '2026-07-06', endDate: '2026-07-19' },
    ports({
      findBoards: async () => [kanban],
      findSprints: async () => { throw new Error('Kanban must not discover Scrum sprints'); },
      findSnapshot: async identity => {
        assert.equal(identity.boardId, 9);
        assert.equal(identity.periodKind, 'kanban');
        assert.equal(new Date(`${identity.periodStartDate}T00:00:00Z`).getUTCDay(), 1);
        assert.equal(new Date(`${identity.periodEndDate}T00:00:00Z`).getUTCDay(), 0);
        return {
          ...snapshot(),
          boardId: 9,
          boardName: 'Kanban Team',
          periodKind: 'kanban',
          sprintId: null,
          sprintName: null,
          periodStartDate: identity.periodStartDate,
          periodEndDate: identity.periodEndDate,
        };
      },
      generateDateRangeReport: async (_startDate, _endDate, _project, _epicId, rawDataOverride) => {
        if (rawDataOverride === undefined) liveCalls++;
        return report;
      },
    }),
  );

  assert.equal(result.source, 'snapshot');
  assert.equal(liveCalls, 0);
});

test('uses Jira when a requested Kanban week has no snapshot', async () => {
  const kanban: BoardResponse = {
    ...board,
    boardId: 9,
    name: 'Kanban Team',
    shortName: 'KANBAN',
    isKanban: true,
    kanbanCycleStartDate: undefined,
  };
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'KANBAN', startDate: '2026-07-27', endDate: '2026-08-09' },
    ports({
      findBoards: async () => [kanban],
      findSprints: async () => [],
      findSnapshot: async () => null,
      generateDateRangeReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(liveCalls, 1);
  assert.equal(metadataFromResolution(result).reason, 'SNAPSHOT_NOT_FOUND');
});

test('combines captured Kanban weeks with only the missing live week', async () => {
  const kanban: BoardResponse = { ...board, boardId: 9, shortName: 'KANBAN', isKanban: true };
  const stored = {
    ...report,
    issues: [{ member: 'A', team: 'KANBAN', level: 'senior', productivityRate: '10.00%', wpProductivity: '10.00%', devDefect: 0, devDefectRate: '100%', totalWeightPoints: 8, weightPointsProduct: 8, weightPointsTechDebt: 0, targetWeightPoints: 80, issueKeys: ['KANBAN-1'], workingDays: 5, spProduct: 8, spTechDebt: 0, spMeeting: 0, spTotal: 8 }],
  } as GetReportResponseDto;
  const live = { ...stored, issues: [{ ...stored.issues[0], totalWeightPoints: 16, weightPointsProduct: 16, issueKeys: ['KANBAN-2'], spProduct: 16, spTotal: 16 }] };
  const liveRanges: string[] = [];
  const result = await resolveTeamReport(
    { project: 'KANBAN', startDate: '2026-07-27', endDate: '2026-08-09' },
    ports({
      findBoards: async () => [kanban],
      findSnapshot: async identity => identity.periodStartDate === '2026-07-27'
        ? { ...snapshot(stored), boardId: 9, periodKind: 'kanban', sprintId: null, sprintName: null, periodStartDate: '2026-07-27', periodEndDate: '2026-08-02' }
        : null,
      generateDateRangeReport: async (startDate, endDate) => { liveRanges.push(`${startDate}/${endDate}`); return live; },
    }),
  );

  assert.equal(result.source, 'mixed');
  assert.deepEqual(liveRanges, ['2026-08-03/2026-08-09']);
  assert.equal(result.value?.totalWeightPoints, 24);
  assert.equal(metadataFromResolution(result).source, 'mixed');
});

test('combines multiple complete snapshots without live Jira or raw-data recalculation', async () => {
  let liveCalls = 0;
  let recalculationCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42,43' },
    ports({
      findSnapshot: async identity => ({ ...snapshot(), sprintId: identity.periodKind === 'scrum' ? identity.sprintId : null }),
      generateSprintReport: async (_sprint, _project, _epicId, rawDataOverride) => {
        if (rawDataOverride === undefined) liveCalls++;
        else recalculationCalls++;
        return report;
      },
    }),
  );

  assert.equal(result.source, 'snapshot');
  assert.equal(liveCalls, 0);
  assert.equal(recalculationCalls, 0);
  assert.deepEqual(result.coverage, { status: 'complete', expected: 2, covered: 2 });
});

test('uses normal live Jira when one requested period has no snapshot', async () => {
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', sprint: '42,43' },
    ports({
      findSnapshot: async identity => identity.periodKind === 'scrum' && identity.sprintId === '43' ? null : snapshot(),
      generateSprintReport: async (_sprint, _project, _epicId, rawDataOverride) => {
        if (rawDataOverride === undefined) liveCalls++;
        return report;
      },
    }),
  );

  assert.equal(result.source, 'jira');
  assert.equal(liveCalls, 1);
  assert.equal(metadataFromResolution(result).fallback, false);
});

test('uses the whole Scrum period whose end date is exactly the selected range end', async () => {
  const lookedUp: string[] = [];
  let liveCalls = 0;
  const result = await resolveTeamReport(
    { project: 'ALPHA', startDate: '2026-07-01', endDate: '2026-07-14' },
    ports({
      findSprints: async () => [
        { id: 42, state: 'closed', startDate: '2026-07-01', endDate: '2026-07-14' },
        { id: 43, state: 'active', startDate: '2026-07-02', endDate: '2026-07-14' },
        { id: 44, state: 'closed', startDate: '2026-07-15', endDate: '2026-07-14' },
        { id: 45, state: 'closed', startDate: '2026-07-15', endDate: '2026-07-28' },
      ],
      findSnapshot: async identity => {
        lookedUp.push(identity.periodKind === 'scrum' ? identity.sprintId : identity.periodEndDate);
        return snapshot();
      },
      generateDateRangeReport: async () => { liveCalls++; return report; },
    }),
  );

  assert.equal(result.source, 'snapshot');
  assert.deepEqual(lookedUp, ['42']);
  assert.equal(liveCalls, 0);
});
