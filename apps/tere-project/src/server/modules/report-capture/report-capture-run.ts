export type CaptureRunStatus = 'running' | 'complete' | 'partial' | 'failed';

export interface CaptureRunWindow {
  readonly startDate: string;
  readonly endDate: string;
}

export interface CaptureRun {
  readonly id: string;
  readonly actor: string;
  readonly window: CaptureRunWindow;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly status: CaptureRunStatus;
  readonly attempted: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly unchanged: number;
}

export interface CaptureRunFailure {
  readonly boardId: number;
  readonly period: string;
  readonly reason: string;
}

export interface CaptureRunCompletion {
  readonly status: Exclude<CaptureRunStatus, 'running'>;
  readonly attempted: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly unchanged: number;
}

export interface CaptureRunRepository {
  create(input: { readonly actor: string; readonly window: CaptureRunWindow }): Promise<CaptureRun>;
  recordFailure(runId: string, failure: CaptureRunFailure): Promise<void>;
  complete(runId: string, result: CaptureRunCompletion): Promise<CaptureRun>;
}

export function safeCaptureFailureReason(reason: unknown): string {
  return typeof reason === 'string' && /^CAPTURE_[A-Z_]{1,96}$/.test(reason)
    ? reason
    : 'CAPTURE_PERIOD_FAILED';
}
