import { eq } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { teamReportingCaptureFailures, teamReportingCaptureRuns } from '@server/db/schema';
import { safeCaptureFailureReason } from './report-capture-run';
import type { CaptureRun, CaptureRunCompletion, CaptureRunFailure, CaptureRunRepository, CaptureRunStatus, CaptureRunWindow } from './report-capture-run';

function toRun(row: typeof teamReportingCaptureRuns.$inferSelect): CaptureRun {
  return {
    id: row.id,
    actor: row.actor,
    window: { startDate: row.windowStartDate, endDate: row.windowEndDate },
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    status: row.status as CaptureRunStatus,
    attempted: row.attemptedCount,
    succeeded: row.succeededCount,
    failed: row.failedCount,
    unchanged: row.unchangedCount,
  };
}

export class DrizzleCaptureRunRepository implements CaptureRunRepository {
  constructor(private readonly database: typeof db = db) {}

  async create(input: { readonly actor: string; readonly window: CaptureRunWindow }): Promise<CaptureRun> {
    assertActor(input.actor);
    assertWindow(input.window);
    const [row] = await this.database.insert(teamReportingCaptureRuns).values({
      actor: input.actor,
      windowStartDate: input.window.startDate,
      windowEndDate: input.window.endDate,
      status: 'running',
      attemptedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      unchangedCount: 0,
    }).returning();
    if (!row) throw new Error('CAPTURE_RUN_CREATE_FAILED');
    return toRun(row);
  }

  async recordFailure(runId: string, failure: CaptureRunFailure): Promise<void> {
    assertId(runId);
    assertFailure(failure);
    await this.database.insert(teamReportingCaptureFailures).values({
      runId,
      boardId: failure.boardId,
      period: failure.period,
      reason: safeCaptureFailureReason(failure.reason),
    }).returning();
  }

  async complete(runId: string, result: CaptureRunCompletion): Promise<CaptureRun> {
    assertId(runId);
    assertCompletion(result);
    const [row] = await this.database.update(teamReportingCaptureRuns).set({
      status: result.status,
      completedAt: new Date(),
      attemptedCount: result.attempted,
      succeededCount: result.succeeded,
      failedCount: result.failed,
      unchangedCount: result.unchanged,
    }).where(eq(teamReportingCaptureRuns.id, runId)).returning();
    if (!row) throw new Error('CAPTURE_RUN_NOT_FOUND');
    return toRun(row);
  }
}

function assertActor(actor: string): void {
  if (typeof actor !== 'string' || !actor.trim() || actor.length > 160) throw new Error('CAPTURE_RUN_ACTOR_INVALID');
}

function assertWindow(window: CaptureRunWindow): void {
  if (!window || !isDate(window.startDate) || !isDate(window.endDate) || window.startDate > window.endDate) throw new Error('CAPTURE_RUN_WINDOW_INVALID');
}

function assertFailure(failure: CaptureRunFailure): void {
  if (!failure || !Number.isInteger(failure.boardId) || failure.boardId <= 0 || typeof failure.period !== 'string' || !failure.period.trim() || failure.period.length > 160) {
    throw new Error('CAPTURE_FAILURE_INVALID');
  }
}

function assertCompletion(result: CaptureRunCompletion): void {
  const counts = [result.attempted, result.succeeded, result.failed, result.unchanged];
  if (!result || !counts.every(value => Number.isInteger(value) && value >= 0)
    || result.succeeded + result.failed + result.unchanged !== result.attempted
    || result.status === 'complete' && result.failed !== 0) throw new Error('CAPTURE_RUN_COMPLETION_INVALID');
}

function assertId(id: string): void {
  if (typeof id !== 'string' || !id.trim()) throw new Error('CAPTURE_RUN_ID_INVALID');
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}
