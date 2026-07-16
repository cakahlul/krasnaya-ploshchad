import { db } from '@server/lib/db';
import { configAuditLog } from '@server/db/schema';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import { AUDIT_PAGE_SIZE, type AuditCursor } from './audit-cursor';

export interface AuditLogEntry<T> {
  id: string;
  entity_id: string;
  action: 'create' | 'delete' | 'update';
  changed_by: string;
  old_value: T | null;
  new_value: T | null;
  changed_at: string;
}

/**
 * Generic keyset-paginated audit log reader shared across config entities
 * (wp_weight_config, holiday, target_wp_config). Mirrors the query previously
 * inlined in WpWeightConfigRepository.fetchAuditLog.
 */
export async function fetchConfigAuditLog<T>(
  entityType: string,
  cursor: AuditCursor | null,
): Promise<AuditLogEntry<T>[]> {
  const cursorTimestamp = cursor ? sql`${cursor.changed_at}::timestamptz` : undefined;
  const rows = await db
    .select({
      id: configAuditLog.id,
      entity_id: configAuditLog.entityId,
      action: configAuditLog.action,
      changed_by: configAuditLog.changedBy,
      old_value: configAuditLog.oldValue,
      new_value: configAuditLog.newValue,
      changed_at: sql<string>`to_char(${configAuditLog.changedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(configAuditLog)
    .where(and(
      eq(configAuditLog.entityType, entityType),
      cursor ? or(
        lt(configAuditLog.changedAt, cursorTimestamp!),
        and(
          eq(configAuditLog.changedAt, cursorTimestamp!),
          lt(configAuditLog.id, cursor.id),
        ),
      ) : undefined,
    ))
    .orderBy(desc(configAuditLog.changedAt), desc(configAuditLog.id))
    .limit(AUDIT_PAGE_SIZE + 1);
  return rows as AuditLogEntry<T>[];
}
