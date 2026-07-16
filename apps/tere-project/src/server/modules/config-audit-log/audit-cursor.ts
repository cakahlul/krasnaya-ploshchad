export interface AuditCursor {
  changed_at: string;
  id: string;
}

export class InvalidAuditCursorError extends Error {
  constructor() {
    super('Invalid audit cursor');
  }
}

const AUDIT_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AUDIT_PAGE_SIZE = 20;

export function decodeAuditCursor(cursor: string): AuditCursor {
  if (!cursor || cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
    throw new InvalidAuditCursorError();
  }

  let value: unknown;
  try {
    const bytes = Buffer.from(cursor, 'base64url');
    if (bytes.toString('base64url') !== cursor) throw new InvalidAuditCursorError();
    value = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new InvalidAuditCursorError();
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidAuditCursorError();
  }
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).sort().join(',') !== 'changed_at,id,v'
    || input.v !== 1
    || typeof input.changed_at !== 'string'
    || typeof input.id !== 'string'
    || !AUDIT_TIMESTAMP_PATTERN.test(input.changed_at)
    || input.changed_at.startsWith('0000-')
    || !UUID_PATTERN.test(input.id)
  ) {
    throw new InvalidAuditCursorError();
  }
  const milliseconds = new Date(`${input.changed_at.slice(0, 23)}Z`);
  if (Number.isNaN(milliseconds.getTime()) || milliseconds.toISOString() !== `${input.changed_at.slice(0, 23)}Z`) {
    throw new InvalidAuditCursorError();
  }
  return { changed_at: input.changed_at, id: input.id };
}

export function paginate<T extends { changed_at: string; id: string }>(
  rows: T[],
): { items: T[]; next_cursor: string | null } {
  const items = rows.slice(0, AUDIT_PAGE_SIZE);
  const boundary = rows.length > AUDIT_PAGE_SIZE ? items[AUDIT_PAGE_SIZE - 1] : undefined;
  return {
    items,
    next_cursor: boundary
      ? Buffer.from(JSON.stringify({ v: 1, changed_at: boundary.changed_at, id: boundary.id })).toString('base64url')
      : null,
  };
}
