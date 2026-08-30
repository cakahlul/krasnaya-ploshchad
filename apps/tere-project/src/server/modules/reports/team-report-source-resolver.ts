import type { BoardResponse } from '@shared/types/board.types';
import type { GetReportResponseDto, JiraIssueEntity } from '@shared/types/report.types';
import type {
  SnapshotPeriodIdentity,
  TeamReportingSnapshot,
  TeamReportingSnapshotLookup,
} from '@server/modules/report-snapshots/report-snapshot';
import {
  resolveReportSource,
  type ReportSourceResolution,
  type ReportUnit,
} from '@server/modules/report-source-resolver/report-source-resolver';
import { combineCapturedReports } from './reports.service';

const DAY = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

interface SprintPeriod {
  readonly id: number;
  readonly state?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface TeamReportingSourcePorts {
  findBoards(): Promise<readonly BoardResponse[]>;
  findSprints(boardId: number): Promise<readonly SprintPeriod[]>;
  findSnapshot(identity: SnapshotPeriodIdentity): Promise<TeamReportingSnapshot | null>;
  findSnapshotStatus?(identity: SnapshotPeriodIdentity): Promise<TeamReportingSnapshotLookup>;
  generateSprintReport(
    sprint: string,
    project: string,
    epicId?: string,
    rawDataOverride?: JiraIssueEntity[],
    plannedDataOverride?: ReadonlyMap<string, JiraIssueEntity[]>,
    sprintDetailsOverride?: { startDate: string; endDate: string },
  ): Promise<GetReportResponseDto>;
  generateDateRangeReport(
    startDate: string,
    endDate: string,
    project: string,
    epicId?: string,
    rawDataOverride?: JiraIssueEntity[],
  ): Promise<GetReportResponseDto>;
}

export interface TeamReportingSourceRequest {
  readonly project: string;
  readonly sprint?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly boardIds?: readonly number[];
  readonly epicId?: string;
}

interface CapturedInput {
  readonly main: JiraIssueEntity[];
  readonly planned: Record<string, JiraIssueEntity[]>;
}

interface SnapshotRecord {
  readonly snapshot: TeamReportingSnapshot;
  readonly input?: CapturedInput;
}

type SnapshotLoad =
  | { readonly kind: 'missing' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'complete'; readonly record: SnapshotRecord };

export async function resolveTeamReport(
  request: TeamReportingSourceRequest,
  ports: TeamReportingSourcePorts,
): Promise<ReportSourceResolution<GetReportResponseDto>> {
  const discovered = await discoverIdentities(request, ports);
  const unit: ReportUnit = {
    kind: 'team-reporting-request',
    key: requestKey(request),
  };

  const mixed = await resolveMixedKanbanRange(request, discovered, ports);
  if (mixed) return mixed;

  return resolveReportSource(unit, [
    {
      source: 'snapshot',
      resolve: async () => {
        if (discovered.identities.length === 0) {
          const detail = discovered.detail ?? 'SNAPSHOT_IDENTITY_UNAVAILABLE';
          return {
            source: 'snapshot',
            detail,
            failureKind: detail === 'SNAPSHOT_IDENTITY_UNAVAILABLE' ? 'missing' : 'error',
          };
        }

        let records: SnapshotRecord[];
        try {
          const loaded = await Promise.all(discovered.identities.map(async identity => {
            let lookup: TeamReportingSnapshotLookup;
            if (ports.findSnapshotStatus) {
              lookup = await ports.findSnapshotStatus(identity);
            } else {
              const stored = await ports.findSnapshot(identity);
              lookup = stored ? { status: 'complete', snapshot: stored } : { status: 'missing' };
            }
            if (lookup.status === 'missing') return { kind: 'missing' } satisfies SnapshotLoad;
            if (lookup.status === 'invalid') return { kind: 'invalid' } satisfies SnapshotLoad;
            return {
              kind: 'complete',
              record: { snapshot: lookup.snapshot, input: capturedInput(lookup.snapshot.rawJiraInput) ?? undefined },
            } satisfies SnapshotLoad;
          }));
          if (loaded.some(value => value.kind === 'invalid')) {
            return {
              source: 'snapshot',
              coverage: {
                expected: discovered.identities.length,
                covered: loaded.filter(value => value.kind === 'complete').length,
                cutoff: false,
              },
              detail: 'SNAPSHOT_INCOMPLETE_OR_CORRUPT',
              failureKind: 'error',
            };
          }
          if (loaded.some((value, index) => value.kind === 'complete'
            && !snapshotMatchesIdentity(value.record.snapshot, discovered.identities[index]))) {
            return {
              source: 'snapshot',
              coverage: {
                expected: discovered.identities.length,
                covered: discovered.identities.length,
                cutoff: false,
              },
              detail: 'SNAPSHOT_IDENTITY_MISMATCH',
              failureKind: 'error',
            };
          }
          const missing = loaded.filter(value => value.kind === 'missing').length;
          if (missing > 0) {
            return {
              source: 'snapshot',
              coverage: {
                expected: discovered.identities.length,
                covered: discovered.identities.length - missing,
                cutoff: false,
              },
              detail: 'SNAPSHOT_NOT_FOUND',
              failureKind: 'missing',
            };
          }
          records = loaded.flatMap(value => value.kind === 'complete' ? [value.record] : []);
        } catch {
          return { source: 'snapshot', detail: 'SNAPSHOT_LOOKUP_FAILED', failureKind: 'error' };
        }

        if (records.some(record => record.input === undefined)) {
          return {
            source: 'snapshot',
            coverage: {
              expected: records.length,
              covered: records.length,
              cutoff: false,
            },
            detail: 'SNAPSHOT_INPUT_INVALID',
            failureKind: 'error',
          };
        }
        if (records.some(record => !isReportResponse(record.snapshot.calculatedOutput))) {
          return {
            source: 'snapshot',
            coverage: {
              expected: records.length,
              covered: records.length,
              cutoff: false,
            },
            detail: 'SNAPSHOT_REPORT_INVALID',
            failureKind: 'error',
          };
        }

        try {
          const value = await reportFromSnapshots(request, records, ports);
          return {
            source: 'snapshot',
            coverage: { expected: records.length, covered: records.length, cutoff: false },
            value,
            snapshotTimestamp: latestSnapshotTimestamp(records),
          };
        } catch {
          return {
            source: 'snapshot',
            coverage: {
              expected: records.length,
              covered: records.length,
              cutoff: false,
            },
            detail: 'SNAPSHOT_RECALCULATION_FAILED',
            failureKind: 'error',
          };
        }
      },
    },
    {
      source: 'jira',
      resolve: async () => ({
        source: 'jira',
        coverage: { expected: 1, covered: 1, cutoff: false },
        value: request.startDate && request.endDate
          ? await ports.generateDateRangeReport(request.startDate, request.endDate, request.project, request.epicId)
          : await ports.generateSprintReport(request.sprint ?? '', request.project, request.epicId),
      }),
    },
  ]);
}

async function discoverIdentities(
  request: TeamReportingSourceRequest,
  ports: TeamReportingSourcePorts,
): Promise<{ identities: SnapshotPeriodIdentity[]; detail?: string; kanbanBoardId?: number }> {
  let boards: readonly BoardResponse[];
  try {
    boards = await ports.findBoards();
  } catch {
    return { identities: [], detail: 'SNAPSHOT_BOARD_LOOKUP_FAILED' };
  }

  const projects = split(request.project).map(project => project.toLowerCase());
  const configured = boards.filter(board =>
    !board.isBugMonitoring
    && projects.includes(board.shortName.toLowerCase()),
  );
  const requestedBoardIds = new Set(request.boardIds ?? []);
  const selected = requestedBoardIds.size === 0
    ? configured
    : configured.filter(board => requestedBoardIds.has(board.boardId));

  if (request.startDate && request.endDate) {
    const discovered = await discoverDateRangeIdentities(request, selected, ports);
    return selected.length === 1 && selected[0].isKanban
      ? { ...discovered, kanbanBoardId: selected[0].boardId }
      : discovered;
  }

  if (request.sprint) {
    const sprintIds = split(request.sprint);
    const scrumBoards = selected.filter(board => !board.isKanban);
    return {
      identities: scrumBoards.flatMap(board => sprintIds.map(sprintId => ({
        boardId: board.boardId,
        periodKind: 'scrum',
        sprintId,
      }))),
    };
  }

  if (!request.startDate || !request.endDate) {
    return { identities: [], detail: 'SNAPSHOT_IDENTITY_UNAVAILABLE' };
  }
  return { identities: [], detail: 'SNAPSHOT_IDENTITY_UNAVAILABLE' };
}

async function resolveMixedKanbanRange(
  request: TeamReportingSourceRequest,
  discovered: { kanbanBoardId?: number },
  ports: TeamReportingSourcePorts,
): Promise<ReportSourceResolution<GetReportResponseDto> | null> {
  if (!request.startDate || !request.endDate || request.epicId || !discovered.kanbanBoardId) return null;
  const today = jakartaDate();
  const snapshots: Array<{ report: GetReportResponseDto; capturedAt: Date }> = [];
  const liveDates = new Set<string>();
  for (const week of mondaySundayWeeksWithin(request.startDate, request.endDate)) {
    if (week.endDate >= today) {
      addDates(liveDates, week.startDate, week.endDate);
      continue;
    }
    const identity: SnapshotPeriodIdentity = { boardId: discovered.kanbanBoardId, periodKind: 'kanban', periodStartDate: week.startDate, periodEndDate: week.endDate };
    let lookup: TeamReportingSnapshotLookup;
    try {
      lookup = ports.findSnapshotStatus
        ? await ports.findSnapshotStatus(identity)
        : await ports.findSnapshot(identity).then(snapshot => snapshot ? { status: 'complete' as const, snapshot } : { status: 'missing' as const });
    } catch {
      return null;
    }
    if (lookup.status === 'complete' && snapshotMatchesIdentity(lookup.snapshot, identity) && isReportResponse(lookup.snapshot.calculatedOutput)) {
      snapshots.push({ report: lookup.snapshot.calculatedOutput, capturedAt: lookup.snapshot.capturedAt });
    } else {
      addDates(liveDates, week.startDate, week.endDate);
    }
  }
  const coveredDays = new Set<string>();
  for (const week of mondaySundayWeeksWithin(request.startDate, request.endDate)) addDates(coveredDays, week.startDate, week.endDate);
  for (let date = request.startDate; date <= request.endDate; date = nextDate(date)) if (!coveredDays.has(date)) liveDates.add(date);
  if (snapshots.length === 0) return null;
  const live = await Promise.all(compactDateRanges(liveDates).map(range => ports.generateDateRangeReport(range.startDate, range.endDate, request.project)));
  const value = combineCapturedReports([...snapshots.map(snapshot => snapshot.report), ...live], { startDate: request.startDate, endDate: request.endDate });
  return {
    source: live.length ? 'mixed' : 'snapshot',
    value,
    coverage: { status: 'complete', expected: snapshots.length + live.length, covered: snapshots.length + live.length },
    attempts: [
      ...(snapshots.length ? [{ source: 'snapshot' as const, coverage: { expected: snapshots.length, covered: snapshots.length, cutoff: false }, snapshotTimestamp: latestDate(snapshots) }] : []),
      ...(live.length ? [{ source: 'jira' as const, coverage: { expected: live.length, covered: live.length, cutoff: false } }] : []),
    ],
  };
}

async function discoverDateRangeIdentities(
  request: TeamReportingSourceRequest,
  selected: readonly BoardResponse[],
  ports: TeamReportingSourcePorts,
): Promise<{ identities: SnapshotPeriodIdentity[]; detail?: string }> {
  const { startDate, endDate } = request;
  if (!startDate || !endDate) return { identities: [], detail: 'SNAPSHOT_IDENTITY_UNAVAILABLE' };
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    return { identities: [], detail: 'INVALID_DATE_RANGE' };
  }

  const identities: SnapshotPeriodIdentity[] = [];
  for (const board of selected) {
    if (board.isKanban) {
      const weeks = completeMondaySundayWeeks(startDate, endDate);
      if (weeks === null) return { identities: [], detail: 'SNAPSHOT_RANGE_NOT_WEEK_ALIGNED' };
      for (const { startDate: periodStartDate, endDate: periodEndDate } of weeks) {
        identities.push({
          boardId: board.boardId,
          periodKind: 'kanban',
          periodStartDate,
          periodEndDate,
        });
      }
      continue;
    }

    let sprints: readonly SprintPeriod[];
    try {
      sprints = await ports.findSprints(board.boardId);
    } catch {
      return { identities: [], detail: 'PERIOD_DISCOVERY_FAILED' };
    }
    for (const sprint of sprints) {
      const sprintStartDate = datePart(sprint.startDate);
      const sprintEndDate = datePart(sprint.endDate);
      if (sprint.state?.toLowerCase() !== 'closed'
        || !sprintStartDate
        || !sprintEndDate
        || sprintStartDate > sprintEndDate
        || sprintStartDate < startDate
        || sprintEndDate < startDate
        || sprintEndDate > endDate) continue;
      identities.push({ boardId: board.boardId, periodKind: 'scrum', sprintId: String(sprint.id) });
    }
  }
  return { identities };
}

async function reportFromSnapshots(
  request: TeamReportingSourceRequest,
  records: readonly SnapshotRecord[],
  ports: TeamReportingSourcePorts,
): Promise<GetReportResponseDto> {
  if (records.length === 1 && !request.epicId) {
    return records[0].snapshot.calculatedOutput as GetReportResponseDto;
  }
  if (!request.epicId) {
    const startDate = request.startDate ?? records.reduce((min, record) => record.snapshot.periodStartDate < min ? record.snapshot.periodStartDate : min, records[0].snapshot.periodStartDate);
    const endDate = request.endDate ?? records.reduce((max, record) => record.snapshot.periodEndDate > max ? record.snapshot.periodEndDate : max, records[0].snapshot.periodEndDate);
    return combineCapturedReports(
      records.map(record => record.snapshot.calculatedOutput as GetReportResponseDto),
      { startDate, endDate },
    );
  }

  const inputs = records.map(record => record.input);
  if (inputs.some(input => input === undefined)) {
    throw new Error('SNAPSHOT_INPUT_INVALID');
  }
  const validInputs = inputs.filter((input): input is CapturedInput => input !== undefined);
  const rawData = uniqueIssues(validInputs.flatMap(input => input.main));
  const plannedData = new Map<string, JiraIssueEntity[]>();
  for (const input of validInputs) {
    for (const [project, issues] of Object.entries(input.planned)) {
      plannedData.set(project, uniqueIssues([...(plannedData.get(project) ?? []), ...issues]));
    }
  }
  const startDate = records.reduce((min, record) => record.snapshot.periodStartDate < min ? record.snapshot.periodStartDate : min, records[0].snapshot.periodStartDate);
  const endDate = records.reduce((max, record) => record.snapshot.periodEndDate > max ? record.snapshot.periodEndDate : max, records[0].snapshot.periodEndDate);
  return request.startDate && request.endDate
    ? ports.generateDateRangeReport(request.startDate, request.endDate, request.project, request.epicId, rawData)
    : ports.generateSprintReport(request.sprint ?? '', request.project, request.epicId, rawData, plannedData, { startDate, endDate });
}

function capturedInput(value: unknown): CapturedInput | null {
  if (!isRecord(value) || !Array.isArray(value.main) || !isRecord(value.planned)) return null;
  if (!value.main.every(isJiraIssue) || !Object.values(value.planned).every(item => Array.isArray(item) && item.every(isJiraIssue))) return null;
  return {
    main: value.main as JiraIssueEntity[],
    planned: value.planned as Record<string, JiraIssueEntity[]>,
  };
}

function uniqueIssues(issues: readonly JiraIssueEntity[]): JiraIssueEntity[] {
  const seen = new Set<string>();
  return issues.filter(issue => {
    if (seen.has(issue.key)) return false;
    seen.add(issue.key);
    return true;
  });
}

function isReportResponse(value: unknown): value is GetReportResponseDto {
  return isRecord(value)
    && Array.isArray(value.issues)
    && value.issues.every(isReportIssue)
    && finiteNumber(value.totalWeightPointsProduct)
    && finiteNumber(value.totalWeightPointsTechDebt)
    && typeof value.productPercentage === 'string'
    && typeof value.techDebtPercentage === 'string'
    && typeof value.averageProductivity === 'string'
    && optionalFiniteFields(value, [
      'totalWorkingDays',
      'averageWorkingDays',
      'averageWpPerHour',
      'totalWeightPoints',
      'totalSP',
      'targetSP',
      'totalLeave',
      'totalSick',
      'totalMemberWorkingDays',
      'sprintId',
    ])
    && optionalStringFields(value, [
      'spProductPercentage',
      'spTechDebtPercentage',
      'spMeetingPercentage',
      'sprintStartDate',
      'sprintEndDate',
      'sprintName',
    ])
    && (value.sourceMetadata === undefined || isFiniteJson(value.sourceMetadata));
}

function isReportIssue(value: unknown): boolean {
  return isRecord(value)
    && typeof value.member === 'string'
    && typeof value.team === 'string'
    && typeof value.productivityRate === 'string'
    && typeof value.wpProductivity === 'string'
    && finiteNumber(value.devDefect)
    && typeof value.devDefectRate === 'string'
    && finiteNumber(value.totalWeightPoints)
    && typeof value.level === 'string'
    && finiteNumber(value.weightPointsProduct)
    && finiteNumber(value.weightPointsTechDebt)
    && finiteNumber(value.targetWeightPoints)
    && Array.isArray(value.issueKeys)
    && value.issueKeys.every(issueKey => typeof issueKey === 'string')
    && optionalFiniteFields(value, [
      'workingDays',
      'wpToHours',
      'spProduct',
      'spTechDebt',
      'spMeeting',
      'spTotal',
      'plannedWP',
      'leaveDays',
      'sickDays',
    ])
    && (value.epicKeys === undefined
      || Array.isArray(value.epicKeys) && value.epicKeys.every(epicKey => typeof epicKey === 'string'))
    && (value.epicBreakdown === undefined
      || isRecord(value.epicBreakdown) && Object.values(value.epicBreakdown).every(isEpicBreakdown))
    && (value.epic === undefined || value.epic === null || isEpic(value.epic));
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalFiniteFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every(field => value[field] === undefined || finiteNumber(value[field]));
}

function optionalStringFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every(field => value[field] === undefined || typeof value[field] === 'string');
}

function isEpicBreakdown(value: unknown): boolean {
  return isRecord(value)
    && typeof value.productivityRate === 'string'
    && typeof value.wpProductivity === 'string'
    && finiteNumber(value.devDefect)
    && typeof value.devDefectRate === 'string'
    && finiteNumber(value.totalWeightPoints)
    && finiteNumber(value.weightPointsProduct)
    && finiteNumber(value.weightPointsTechDebt)
    && Array.isArray(value.issueKeys)
    && value.issueKeys.every(issueKey => typeof issueKey === 'string')
    && optionalFiniteFields(value, ['wpToHours', 'spProduct', 'spTechDebt', 'spMeeting', 'spTotal']);
}

function isEpic(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.key === 'string'
    && typeof value.name === 'string'
    && typeof value.summary === 'string'
    && (value.status === undefined || typeof value.status === 'string');
}

function isFiniteJson(value: unknown): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isFiniteJson);
  return isRecord(value) && Object.values(value).every(isFiniteJson);
}

function snapshotMatchesIdentity(
  snapshot: TeamReportingSnapshot,
  identity: SnapshotPeriodIdentity,
): boolean {
  if (snapshot.boardId !== identity.boardId || snapshot.periodKind !== identity.periodKind) return false;
  return identity.periodKind === 'scrum'
    ? snapshot.sprintId === identity.sprintId
    : snapshot.sprintId === null
      && snapshot.periodStartDate === identity.periodStartDate
      && snapshot.periodEndDate === identity.periodEndDate;
}

function isJiraIssue(value: unknown): value is JiraIssueEntity {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.key === 'string'
    && isRecord(value.fields);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function latestSnapshotTimestamp(records: readonly SnapshotRecord[]): string | undefined {
  return records
    .map(record => record.snapshot.capturedAt)
    .filter(value => value instanceof Date && Number.isFinite(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]
    ?.toISOString();
}

function requestKey(request: TeamReportingSourceRequest): string {
  return [
    request.project,
    request.sprint ?? '',
    request.startDate ?? '',
    request.endDate ?? '',
    (request.boardIds ?? []).join(','),
  ].join('|');
}

function split(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function datePart(value: string | undefined): string | null {
  const date = value?.slice(0, 10);
  return date && validDate(date) ? date : null;
}

function validDate(value: string): boolean {
  return DATE.test(value)
    && new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value;
}

function parseDate(value: string): number {
  return Date.parse(value + 'T00:00:00.000Z');
}

function completeMondaySundayWeeks(startDate: string, endDate: string): Array<{ startDate: string; endDate: string }> | null {
  if (new Date(parseDate(startDate)).getUTCDay() !== 1 || new Date(parseDate(endDate)).getUTCDay() !== 0) return null;
  const weeks: Array<{ startDate: string; endDate: string }> = [];
  for (let start = startDate; start <= endDate; start = new Date(parseDate(start) + 7 * DAY).toISOString().slice(0, 10)) {
    weeks.push({ startDate: start, endDate: new Date(parseDate(start) + 6 * DAY).toISOString().slice(0, 10) });
  }
  return weeks;
}

function mondaySundayWeeksWithin(startDate: string, endDate: string): Array<{ startDate: string; endDate: string }> {
  const weeks: Array<{ startDate: string; endDate: string }> = [];
  let weekStart = nextDate(startDate, (8 - new Date(parseDate(startDate)).getUTCDay()) % 7);
  while (nextDate(weekStart, 6) <= endDate) {
    weeks.push({ startDate: weekStart, endDate: nextDate(weekStart, 6) });
    weekStart = nextDate(weekStart, 7);
  }
  return weeks;
}

function addDates(target: Set<string>, startDate: string, endDate: string): void {
  for (let date = startDate; date <= endDate; date = nextDate(date)) target.add(date);
}

function compactDateRanges(dates: ReadonlySet<string>): Array<{ startDate: string; endDate: string }> {
  const sorted = [...dates].sort();
  const ranges: Array<{ startDate: string; endDate: string }> = [];
  for (const date of sorted) {
    const previous = ranges.at(-1);
    if (previous && nextDate(previous.endDate) === date) previous.endDate = date;
    else ranges.push({ startDate: date, endDate: date });
  }
  return ranges;
}

function nextDate(date: string, days = 1): string { return new Date(parseDate(date) + days * DAY).toISOString().slice(0, 10); }
function latestDate(snapshots: readonly { capturedAt: Date }[]): string | undefined {
  return snapshots.map(snapshot => snapshot.capturedAt).sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString();
}
function jakartaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
