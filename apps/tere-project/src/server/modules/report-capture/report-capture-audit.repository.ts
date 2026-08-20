import { db } from '@server/lib/db';
import { teamReportingCaptureSnapshotAudits } from '@server/db/schema';
import type { CaptureSnapshotAudit, CaptureSnapshotAuditChange, CaptureSnapshotAuditRepository, NewCaptureSnapshotAudit } from './report-capture-audit';

type CaptureSnapshotAuditWriter = Pick<typeof db, 'insert'>;

export class DrizzleCaptureSnapshotAuditRepository implements CaptureSnapshotAuditRepository {
  constructor(private readonly database: typeof db = db) {}

  record(input: NewCaptureSnapshotAudit): Promise<CaptureSnapshotAudit> {
    return insertCaptureSnapshotAudit(this.database, input);
  }
}

export async function insertCaptureSnapshotAudit(
  database: CaptureSnapshotAuditWriter,
  input: NewCaptureSnapshotAudit,
): Promise<CaptureSnapshotAudit> {
  const audit = validateAudit(input);
  const [row] = await database.insert(teamReportingCaptureSnapshotAudits).values(audit).returning();
  if (!row) throw new Error('CAPTURE_AUDIT_CREATE_FAILED');
  return row as CaptureSnapshotAudit;
}

function validateAudit(input: NewCaptureSnapshotAudit) {
  if (!input || !isId(input.runId) || !isId(input.snapshotId) || !checksums(input)) throw new Error('CAPTURE_AUDIT_INVALID');
  const addedJiraKeys = keys(input.addedJiraKeys);
  const removedJiraKeys = keys(input.removedJiraKeys);
  const changedJiraKeys = changes(input.changedJiraKeys);
  const calculatedPaths = paths(input.calculatedPaths);
  const allKeys = [...addedJiraKeys, ...removedJiraKeys, ...changedJiraKeys.map(change => change.key)];
  if (new Set(allKeys).size !== allKeys.length) throw new Error('CAPTURE_AUDIT_INVALID');
  return {
    ...input,
    addedJiraKeys,
    removedJiraKeys,
    changedJiraKeys,
    calculatedPaths,
    summary: json(input.summary),
  };
}

function checksums(input: NewCaptureSnapshotAudit): boolean {
  return [input.previousRawInputChecksum, input.nextRawInputChecksum, input.previousCalculatedOutputChecksum, input.nextCalculatedOutputChecksum]
    .every(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value));
}

function keys(value: readonly string[]): string[] {
  if (!Array.isArray(value) || value.length > 10_000 || value.some(key => typeof key !== 'string' || !key.trim() || key.length > 160)) throw new Error('CAPTURE_AUDIT_INVALID');
  return [...value];
}

function changes(value: readonly CaptureSnapshotAuditChange[]): Array<{ key: string; fields: Array<{ path: string; previous: unknown; next: unknown }> }> {
  if (!Array.isArray(value) || value.length > 10_000) throw new Error('CAPTURE_AUDIT_INVALID');
  return value.map(change => {
    if (!change || typeof change.key !== 'string' || !change.key.trim() || change.key.length > 160 || !Array.isArray(change.fields) || !change.fields.length) throw new Error('CAPTURE_AUDIT_INVALID');
    return {
      key: change.key,
      fields: change.fields.map((field: { readonly path: string; readonly previous: unknown; readonly next: unknown }) => {
        if (!field || typeof field.path !== 'string' || !field.path.trim() || field.path.length > 512) throw new Error('CAPTURE_AUDIT_INVALID');
        const redact = isSensitive(field.path);
        return { path: field.path, previous: redact ? '[REDACTED]' : json(field.previous), next: redact ? '[REDACTED]' : json(field.next) };
      }),
    };
  });
}

function paths(value: readonly string[]): string[] {
  if (!Array.isArray(value) || value.length > 10_000 || value.some(path => typeof path !== 'string' || !path.trim() || path.length > 512)) throw new Error('CAPTURE_AUDIT_INVALID');
  return [...value];
}

function json(value: unknown, depth = 0): unknown {
  if (depth > 16) throw new Error('CAPTURE_AUDIT_INVALID');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
    throw new Error('CAPTURE_AUDIT_INVALID');
  }
  if (Array.isArray(value)) {
    if (value.length > 10_000) throw new Error('CAPTURE_AUDIT_INVALID');
    return value.map(item => json(item, depth + 1));
  }
  if (typeof value === 'object' && value) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 10_000) throw new Error('CAPTURE_AUDIT_INVALID');
    return Object.fromEntries(entries.map(([key, item]) => [key, isSensitive(key) ? '[REDACTED]' : json(item, depth + 1)]));
  }
  throw new Error('CAPTURE_AUDIT_INVALID');
}

function isSensitive(value: string): boolean {
  return /(?:authorization|password|secret|token|api[_-]?key|email(?:address)?|phone(?:number)?|accountid|displayname|address)/i.test(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}
