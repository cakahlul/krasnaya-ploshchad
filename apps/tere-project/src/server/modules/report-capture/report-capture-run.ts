export type CaptureRunStatus = 'running' | 'complete' | 'partial' | 'failed';
export type CaptureFailureStage = 'discovery' | 'enumeration' | 'validation' | 'fetch' | 'calculate' | 'publish' | 'unknown';
export const MAX_CAPTURE_FAILURE_DETAIL_LENGTH = 1000;

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
  readonly failureReason: string | null;
  readonly failureDetail: string | null;
  readonly attempted: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly unchanged: number;
}

export interface CaptureRunFailure {
  readonly boardId: number;
  readonly period: string;
  readonly reason: string;
  readonly stage?: CaptureFailureStage;
  readonly detail?: string | null;
}

export interface CaptureRunCompletion {
  readonly status: Exclude<CaptureRunStatus, 'running'>;
  readonly failureReason?: string | null;
  readonly failureDetail?: string | null;
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

export function captureFailureDetail(error: unknown, stage: CaptureFailureStage): string {
  const parts = [`stage=${stage}`];
  if (error instanceof Error && error.name) parts.push(`name=${error.name}`);
  const record = isRecord(error) ? error : null;
  const code = record && typeof record.code === 'string' ? record.code : null;
  if (code) parts.push(`code=${code}`);
  const status = responseStatus(record);
  if (status !== null) parts.push(`status=${status}`);
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : record && typeof record.message === 'string' ? record.message : 'Unknown capture failure';
  parts.push(`message=${message || 'Unknown capture failure'}`);
  return safeCaptureFailureDetail(parts.join(' ')) ?? `stage=${stage} message=Unknown capture failure`;
}

export function safeCaptureFailureDetail(detail: unknown): string | null {
  if (typeof detail !== 'string') return null;
  const redacted = detail
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/(\b(?:authorization|proxy-authorization)\b\s*[:=]\s*)[^;]*?(?=\s+(?:stage|name|code|status|message)=|$)/gi, '$1[REDACTED]')
    .replace(/\b(Bearer|Basic|Token|Digest)\s+[^\s,;]+/gi, '$1 [REDACTED]')
    .replace(/(\b(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key|api[-_]?key|api[-_]?token|access[-_]?token|refresh[-_]?token|id[-_]?token|password|secret|token)\b\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/https?:\/\/[^\s]+/gi, '[URL]')
    .replace(/\s+/g, ' ')
    .trim();
  return redacted ? redacted.slice(0, MAX_CAPTURE_FAILURE_DETAIL_LENGTH) : null;
}

function responseStatus(error: Record<string, unknown> | null): number | null {
  const response = error && isRecord(error.response) ? error.response : null;
  const status = response && response.status;
  return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
