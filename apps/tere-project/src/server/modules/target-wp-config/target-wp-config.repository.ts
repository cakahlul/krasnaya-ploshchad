import { db } from '@server/lib/db';
import { configAuditLog, targetWpConfig } from '@server/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  fetchConfigAuditLog,
  type AuditCursor,
  type AuditLogEntry,
} from '@server/modules/config-audit-log';

export type TargetWpRates = Record<string, number>;

export interface TargetWpConfig {
  id?: string;
  effective_date: string;
  rates: TargetWpRates;
}

export type TargetWpAuditCursor = AuditCursor;
export type TargetWpAuditEntry = AuditLogEntry<TargetWpConfig>;

const DEFAULT_RATES: TargetWpRates = {
  junior: 4.5,
  medior: 6,
  senior: 8,
  'individual contributor': 8,
};

type Row = typeof targetWpConfig.$inferSelect;

function rowToConfig(row: Row): TargetWpConfig {
  return {
    id: row.id,
    effective_date: row.effectiveDate,
    rates: row.rates as TargetWpRates,
  };
}

export class TargetWpConfigRepository {
  fetchAuditLog(cursor: TargetWpAuditCursor | null): Promise<TargetWpAuditEntry[]> {
    return fetchConfigAuditLog<TargetWpConfig>('target_wp_config', cursor);
  }

  async fetchAll(): Promise<TargetWpConfig[]> {
    try {
      const rows = await db
        .select()
        .from(targetWpConfig)
        .orderBy(desc(targetWpConfig.effectiveDate));
      return rows.map(rowToConfig);
    } catch {
      return [];
    }
  }

  async getEffectiveRates(sprintStartDate: string): Promise<TargetWpRates> {
    try {
      const all = await this.fetchAll();
      const match = all
        .filter((c) => c.effective_date <= sprintStartDate)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
      return match?.rates ?? DEFAULT_RATES;
    } catch {
      return DEFAULT_RATES;
    }
  }

  async createWithAudit(
    effective_date: string,
    rates: TargetWpRates,
    changedBy: string,
  ): Promise<TargetWpConfig> {
    return db.transaction(async tx => {
      const [row] = await tx
        .insert(targetWpConfig)
        .values({ effectiveDate: effective_date, rates })
        .returning();
      const config = rowToConfig(row);
      await tx.insert(configAuditLog).values({
        entityType: 'target_wp_config',
        entityId: config.id!,
        action: 'create',
        changedBy,
        oldValue: null,
        newValue: config,
      });
      return config;
    });
  }

  async updateWithAudit(
    id: string,
    effective_date: string,
    rates: TargetWpRates,
    changedBy: string,
  ): Promise<TargetWpConfig | null> {
    return db.transaction(async tx => {
      const [existing] = await tx
        .select()
        .from(targetWpConfig)
        .where(eq(targetWpConfig.id, id));
      if (!existing) return null;

      const oldConfig = rowToConfig(existing);
      const [row] = await tx
        .update(targetWpConfig)
        .set({ effectiveDate: effective_date, rates })
        .where(eq(targetWpConfig.id, id))
        .returning();
      if (!row) return null;

      const newConfig = rowToConfig(row);
      await tx.insert(configAuditLog).values({
        entityType: 'target_wp_config',
        entityId: newConfig.id!,
        action: 'update',
        changedBy,
        oldValue: oldConfig,
        newValue: newConfig,
      });
      return newConfig;
    });
  }

  async deleteWithAudit(id: string, changedBy: string): Promise<TargetWpConfig | null> {
    return db.transaction(async tx => {
      const [row] = await tx
        .delete(targetWpConfig)
        .where(eq(targetWpConfig.id, id))
        .returning();
      if (!row) return null;

      const config = rowToConfig(row);
      await tx.insert(configAuditLog).values({
        entityType: 'target_wp_config',
        entityId: config.id!,
        action: 'delete',
        changedBy,
        oldValue: config,
        newValue: null,
      });
      return config;
    });
  }
}
