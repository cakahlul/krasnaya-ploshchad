import {
  snapshotChecksum,
  type TeamReportingSnapshotPublication,
  type TeamReportingSnapshotRepository,
} from '@server/modules/report-snapshots/report-snapshot';

export interface CaptureWindow { readonly startDate: string; readonly endDate: string }
export interface CaptureBoard { readonly boardId: number; readonly boardName: string; readonly isBugMonitoring?: boolean }
export interface CapturePeriod {
  readonly boardId: number; readonly boardName: string; readonly periodKind: 'scrum' | 'kanban';
  readonly sprintId?: string | null; readonly sprintName?: string | null;
  readonly periodStartDate: string; readonly periodEndDate: string;
}
export interface CaptureSegment { readonly segmentKey: string; readonly value: unknown; readonly count: number }
export interface JiraCaptureResult { readonly rawInput: unknown; readonly segments: readonly CaptureSegment[] }
export interface CalculatedCaptureResult { readonly calculatedOutput: unknown; readonly segments: readonly CaptureSegment[] }
export interface CaptureFailure { readonly board: number; readonly period: string; readonly reason: string }
export interface CaptureAttempt { readonly board: number; readonly period: string; readonly status: 'success' | 'failure'; readonly reason?: string }
export interface CaptureSummary { readonly attempted: number; readonly successes: number; readonly failures: readonly CaptureFailure[]; readonly attempts: readonly CaptureAttempt[] }

export interface DeveloperCapturePorts {
  boards(): Promise<readonly CaptureBoard[]>;
  periods(board: CaptureBoard, window: CaptureWindow): Promise<readonly CapturePeriod[]>;
  fetchJira(period: CapturePeriod): Promise<JiraCaptureResult>;
  calculate(period: CapturePeriod, rawInput: unknown): Promise<CalculatedCaptureResult>;
  repository: Pick<TeamReportingSnapshotRepository, 'publish'>;
}

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function createDeveloperCaptureService(ports: DeveloperCapturePorts) {
  return { capture: (window: CaptureWindow) => capture(window, ports), backfill2026: () => backfill2026(ports) };
}

export function backfill2026(ports: DeveloperCapturePorts): Promise<CaptureSummary> {
  return capture({ startDate: '2026-01-01', endDate: '2026-12-31' }, ports);
}

export async function capture(window: CaptureWindow, ports: DeveloperCapturePorts): Promise<CaptureSummary> {
  assertWindow(window);
  const boards = (await ports.boards()).filter(board => Number.isInteger(board.boardId) && board.boardId > 0 && !board.isBugMonitoring);
  const failures: CaptureFailure[] = [];
  const attempts: CaptureAttempt[] = [];
  const periodLoads = await Promise.allSettled(boards.map(board => ports.periods(board, window)));
  const periods = periodLoads.flatMap((load, index) => {
    if (load.status === 'rejected') {
      failures.push({ board: boards[index].boardId, period: 'enumeration', reason: 'CAPTURE_PERIOD_ENUMERATION_FAILED' });
      return [];
    }
    return load.value.filter(period => {
      if (!validPeriod(period) || period.boardId !== boards[index].boardId) {
        failures.push({ board: boards[index].boardId, period: 'invalid', reason: 'CAPTURE_PERIOD_INVALID' });
        return false;
      }
      return period.periodEndDate >= window.startDate && period.periodEndDate <= window.endDate;
    });
  });
  let successes = 0;
  for (const period of periods) {
    try {
      const jira = await ports.fetchJira(period);
      validateJira(jira);
      const calculated = await ports.calculate(period, jira.rawInput);
      validateCalculated(calculated);
      const publication = toPublication(period, jira, calculated);
      await ports.repository.publish(publication);
      successes += 1;
      attempts.push({ board: period.boardId, period: capturePeriodIdentity(period), status: 'success' });
    } catch (error) {
      const failure = { board: period.boardId, period: capturePeriodIdentity(period), reason: safeReason(error) };
      failures.push(failure);
      attempts.push({ ...failure, status: 'failure' });
    }
  }
  return { attempted: periods.length, successes, failures, attempts };
}

function capturePeriodIdentity(period: CapturePeriod): string { return period.sprintId ?? `${period.periodStartDate}/${period.periodEndDate}`; }

function toPublication(period: CapturePeriod, jira: JiraCaptureResult, calculated: CalculatedCaptureResult): TeamReportingSnapshotPublication {
  const coverage = jira.segments.map(segment => {
    const output = calculated.segments.find(item => item.segmentKey === segment.segmentKey);
    if (!output) throw new Error('CAPTURE_SEGMENT_MISMATCH');
    return { segmentKey: segment.segmentKey, rawInputCount: segment.count, calculatedOutputCount: output.count, checksum: snapshotChecksum(segment.value) };
  });
  if (coverage.length === 0 || coverage.length !== calculated.segments.length) throw new Error('CAPTURE_SEGMENT_MISMATCH');
  const rawInputCount = jira.segments.reduce((sum, segment) => sum + segment.count, 0);
  const calculatedOutputCount = calculated.segments.reduce((sum, segment) => sum + segment.count, 0);
  return {
    snapshot: {
      boardId: period.boardId, boardName: period.boardName, periodKind: period.periodKind,
      sprintId: period.periodKind === 'scrum' ? (period.sprintId ?? null) : null,
      sprintName: period.periodKind === 'scrum' ? (period.sprintName ?? null) : null,
      periodStartDate: period.periodStartDate, periodEndDate: period.periodEndDate,
      reportingMonth: `${period.periodEndDate.slice(0, 7)}-01`, rawJiraInput: jira.rawInput,
      calculatedOutput: calculated.calculatedOutput, rawInputCount, calculatedOutputCount,
      rawInputChecksum: snapshotChecksum(jira.rawInput), calculatedOutputChecksum: snapshotChecksum(calculated.calculatedOutput),
      integrityEvidence: { source: 'jira', rawInputCount, calculatedOutputCount, segmentCount: coverage.length },
    }, coverage,
  };
}

function validateJira(value: JiraCaptureResult): asserts value is JiraCaptureResult {
  if (!value || typeof value !== 'object' || value.rawInput === null || !Array.isArray(value.segments)) throw new Error('CAPTURE_JIRA_INVALID');
  validateSegments(value.segments);
}
function validateCalculated(value: CalculatedCaptureResult): asserts value is CalculatedCaptureResult {
  if (!value || typeof value !== 'object' || value.calculatedOutput === null || !Array.isArray(value.segments)) throw new Error('CAPTURE_CALCULATION_INVALID');
  validateSegments(value.segments);
}
function validateSegments(segments: readonly CaptureSegment[]) {
  if (!segments.length || segments.some(segment => typeof segment.segmentKey !== 'string' || !segment.segmentKey.trim() || !Number.isInteger(segment.count) || segment.count < 0)) throw new Error('CAPTURE_SEGMENTS_INVALID');
  if (new Set(segments.map(segment => segment.segmentKey)).size !== segments.length) throw new Error('CAPTURE_SEGMENTS_INVALID');
}
function assertWindow(window: CaptureWindow) {
  if (!window || !validDate(window.startDate) || !validDate(window.endDate) || window.startDate > window.endDate) throw new Error('CAPTURE_WINDOW_INVALID');
  const start = Date.parse(`${window.startDate}T00:00:00Z`); const end = Date.parse(`${window.endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || (end - start) / DAY > 366) throw new Error('CAPTURE_WINDOW_TOO_LARGE');
}
function validPeriod(period: CapturePeriod): boolean {
  return Number.isInteger(period.boardId) && period.boardId > 0
    && (period.periodKind === 'scrum' || period.periodKind === 'kanban')
    && validDate(period.periodStartDate) && validDate(period.periodEndDate)
    && period.periodStartDate <= period.periodEndDate
    && (period.periodKind === 'kanban' || typeof period.sprintId === 'string' && period.sprintId.trim() !== '');
}
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function safeReason(error: unknown): string { return error instanceof Error && /^CAPTURE_[A-Z_]+$/.test(error.message) ? error.message : 'CAPTURE_PERIOD_FAILED'; }

export type DeveloperCaptureService = ReturnType<typeof createDeveloperCaptureService>;
