import {
  snapshotChecksum,
  type TeamReportingSnapshotPublication,
  type TeamReportingSnapshotRepository,
} from '@server/modules/report-snapshots/report-snapshot';
import { captureFailureDetail, type CaptureFailureStage, type CaptureRunCompletion, type CaptureRunRepository, type CaptureRunStatus } from './report-capture-run';

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
export interface CaptureFailure {
  readonly board: number; readonly period: string; readonly reason: string;
  readonly stage?: CaptureFailureStage; readonly detail?: string | null;
}
export interface CaptureAttempt {
  readonly board: number; readonly period: string; readonly status: 'success' | 'failure'; readonly reason?: string;
  readonly stage?: CaptureFailureStage; readonly detail?: string | null;
}
export interface CaptureSummary {
  readonly attempted: number; readonly successes: number; readonly failures: readonly CaptureFailure[]; readonly attempts: readonly CaptureAttempt[];
  readonly runId?: string; readonly status?: CaptureRunStatus; readonly created?: number; readonly changed?: number; readonly unchanged?: number; readonly durationMs?: number; readonly failureDetail?: string;
}

export interface DeveloperCapturePorts {
  boards(): Promise<readonly CaptureBoard[]>;
  periods(board: CaptureBoard, window: CaptureWindow): Promise<readonly CapturePeriod[]>;
  fetchJira(period: CapturePeriod): Promise<JiraCaptureResult>;
  calculate(period: CapturePeriod, rawInput: unknown): Promise<CalculatedCaptureResult>;
  repository: Pick<TeamReportingSnapshotRepository, 'publish'> | Pick<TeamReportingSnapshotRepository, 'publishWithOutcome'>;
  runRepository?: CaptureRunRepository;
  now?: () => Date;
}

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function createDeveloperCaptureService(ports: DeveloperCapturePorts) {
  return {
    capture: (window: CaptureWindow, actor = 'System') => capture(window, ports, actor),
    backfill2026: (actor = 'System') => backfill2026(ports, actor),
  };
}

export function backfill2026(ports: DeveloperCapturePorts, actor = 'System'): Promise<CaptureSummary> {
  return capture({ startDate: '2026-01-01', endDate: '2026-12-31' }, ports, actor);
}

export async function capture(window: CaptureWindow, ports: DeveloperCapturePorts, actor = 'System'): Promise<CaptureSummary> {
  assertWindow(window);
  const startedAt = (ports.now ? ports.now() : new Date()).getTime();
  const run = ports.runRepository ? await ports.runRepository.create({ actor, window }) : undefined;
  const failures: CaptureFailure[] = [];
  const attempts: CaptureAttempt[] = [];
  const recordFailure = async (failure: CaptureFailure) => {
    failures.push(failure);
    attempts.push({ ...failure, status: 'failure' });
    if (run) await ports.runRepository!.recordFailure(run.id, {
      boardId: failure.board, period: failure.period, reason: failure.reason, stage: failure.stage, detail: failure.detail,
    });
  };
  let boards: CaptureBoard[];
  try {
    boards = (await ports.boards()).filter(board => Number.isInteger(board.boardId) && board.boardId > 0 && !board.isBugMonitoring);
  } catch (error) {
    const detail = captureFailureDetail(error, 'discovery');
    const failure = { board: 0, period: 'discovery', reason: 'CAPTURE_BOARD_DISCOVERY_FAILED', stage: 'discovery' as const, detail };
    failures.push(failure);
    attempts.push({ ...failure, status: 'failure' });
    return completeCapture(window, ports, run?.id, startedAt, 0, 0, 0, failures, attempts, 'CAPTURE_BOARD_DISCOVERY_FAILED', detail);
  }
  const periodLoads = await Promise.allSettled(boards.map(board => ports.periods(board, window)));
  const periods: CapturePeriod[] = [];
  for (const [index, load] of periodLoads.entries()) {
    if (load.status === 'rejected') {
      await recordFailure({
        board: boards[index].boardId, period: 'enumeration', reason: safeReason(load.reason, 'CAPTURE_PERIOD_ENUMERATION_FAILED'),
        stage: 'enumeration', detail: captureFailureDetail(load.reason, 'enumeration'),
      });
      continue;
    }
    for (const period of load.value) {
      if (!validPeriod(period) || period.boardId !== boards[index].boardId) {
        await recordFailure({ board: boards[index].boardId, period: 'invalid', reason: 'CAPTURE_PERIOD_INVALID', stage: 'validation' });
      } else if (period.periodEndDate >= window.startDate && period.periodEndDate <= window.endDate) {
        periods.push(period);
      }
    }
  }
  let created = 0;
  let changed = 0;
  let unchanged = 0;
  for (const period of periods) {
    let stage: CaptureFailureStage = 'fetch';
    try {
      const jira = await ports.fetchJira(period);
      stage = 'validation';
      validateJira(jira);
      stage = 'calculate';
      const calculated = await ports.calculate(period, jira.rawInput);
      stage = 'validation';
      validateCalculated(calculated);
      validatePublicationSegments(jira, calculated);
      stage = 'publish';
      const publication = toPublication(period, jira, calculated);
      const outcome = await publish(ports.repository, publication, run?.id);
      if (outcome.kind === 'created') created += 1;
      else if (outcome.kind === 'replaced') changed += 1;
      else unchanged += 1;
      attempts.push({ board: period.boardId, period: capturePeriodIdentity(period), status: 'success' });
    } catch (error) {
      const failure = { board: period.boardId, period: capturePeriodIdentity(period), reason: safeReason(error), stage, detail: captureFailureDetail(error, stage) };
      await recordFailure(failure);
    }
  }
  return completeCapture(window, ports, run?.id, startedAt, created, changed, unchanged, failures, attempts);
}

async function completeCapture(
  window: CaptureWindow, ports: DeveloperCapturePorts, runId: string | undefined, startedAt: number | undefined,
  created: number, changed: number, unchanged: number, failures: readonly CaptureFailure[], attempts: readonly CaptureAttempt[], failureReason?: string,
  failureDetail?: string,
): Promise<CaptureSummary> {
  const successes = created + changed;
  const completion: CaptureRunCompletion = {
    status: failures.length ? (successes + unchanged ? 'partial' : 'failed') : 'complete',
    attempted: attempts.length, succeeded: successes, failed: failures.length, unchanged,
    ...(failureReason ? { failureReason } : {}),
    ...(failureDetail ? { failureDetail } : {}),
  };
  if (runId) await ports.runRepository!.complete(runId, completion);
  return {
    attempted: completion.attempted, successes, failures, attempts,
    ...(runId ? { runId, status: completion.status, created, changed, unchanged, ...(failureReason ? { failureReason } : {}), durationMs: Math.max(0, (ports.now ? ports.now() : new Date()).getTime() - (startedAt ?? 0)) } : {}),
    ...(failureDetail ? { failureDetail } : {}),
  };
}

async function publish(
  repository: DeveloperCapturePorts['repository'], publication: TeamReportingSnapshotPublication, runId: string | undefined,
) {
  if ('publishWithOutcome' in repository) return repository.publishWithOutcome(publication, { runId: runId ?? 'legacy' });
  if (runId) throw new Error('CAPTURE_PUBLISH_OUTCOME_REQUIRED');
  return { kind: 'created' as const, snapshot: await repository.publish(publication) };
}

function capturePeriodIdentity(period: CapturePeriod): string { return period.sprintId ?? `${period.periodStartDate}/${period.periodEndDate}`; }

function toPublication(period: CapturePeriod, jira: JiraCaptureResult, calculated: CalculatedCaptureResult): TeamReportingSnapshotPublication {
  const coverage = jira.segments.map(segment => {
    const output = calculated.segments.find(item => item.segmentKey === segment.segmentKey)!;
    return { segmentKey: segment.segmentKey, rawInputCount: segment.count, calculatedOutputCount: output.count, checksum: snapshotChecksum(segment.value) };
  });
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

function validatePublicationSegments(jira: JiraCaptureResult, calculated: CalculatedCaptureResult): void {
  if (jira.segments.length === 0 || jira.segments.length !== calculated.segments.length
    || jira.segments.some(segment => !calculated.segments.some(item => item.segmentKey === segment.segmentKey))) {
    throw new Error('CAPTURE_SEGMENT_MISMATCH');
  }
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
function safeReason(error: unknown, fallback = 'CAPTURE_PERIOD_FAILED'): string {
  return error instanceof Error && /^CAPTURE_[A-Z_]+$/.test(error.message) ? error.message : fallback;
}

export type DeveloperCaptureService = ReturnType<typeof createDeveloperCaptureService>;
