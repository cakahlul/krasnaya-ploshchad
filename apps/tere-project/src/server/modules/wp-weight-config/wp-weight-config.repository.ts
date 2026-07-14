import { db } from '@server/lib/db';
import { configAuditLog, wpWeightConfig } from '@server/db/schema';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import type { AppendixWeightPoint } from '@shared/utils/appendix-level';

export type WpWeights = Record<AppendixWeightPoint, number>;

export interface WpWeightConfig {
  id: string;
  effective_date: string;
  weights: WpWeights;
}

const DEFAULT_WEIGHTS: WpWeights = {
  'Very Low': 1,
  Low: 2,
  Medium: 4,
  High: 8,
};

type Row = typeof wpWeightConfig.$inferSelect;

function rowToConfig(row: Row): WpWeightConfig {
  return {
    id: row.id,
    effective_date: row.effectiveDate,
    weights: row.weights as WpWeights,
  };
}

export class WpWeightConfigRepository {
  async fetchAll(): Promise<WpWeightConfig[]> {
    const rows = await db
      .select()
      .from(wpWeightConfig)
      .orderBy(desc(wpWeightConfig.effectiveDate));
    return rows.map(rowToConfig);
  }

  async getEffectiveWeights(sprintStartDate: string): Promise<WpWeights> {
    const [row] = await db
      .select()
      .from(wpWeightConfig)
      .where(lte(wpWeightConfig.effectiveDate, sprintStartDate))
      .orderBy(desc(wpWeightConfig.effectiveDate))
      .limit(1);
    return row ? rowToConfig(row).weights : DEFAULT_WEIGHTS;
  }

  async findByEffectiveDate(effectiveDate: string): Promise<WpWeightConfig | null> {
    const [row] = await db
      .select()
      .from(wpWeightConfig)
      .where(eq(wpWeightConfig.effectiveDate, effectiveDate))
      .limit(1);
    return row ? rowToConfig(row) : null;
  }

  async findById(id: string): Promise<WpWeightConfig | null> {
    const [row] = await db
      .select()
      .from(wpWeightConfig)
      .where(eq(wpWeightConfig.id, id))
      .limit(1);
    return row ? rowToConfig(row) : null;
  }

  async createWithAudit(
    effectiveDate: string,
    weights: WpWeights,
    changedBy: string,
  ): Promise<WpWeightConfig> {
    return db.transaction(async tx => {
      const [row] = await tx
        .insert(wpWeightConfig)
        .values({ effectiveDate, weights })
        .returning();
      const config = rowToConfig(row);
      await tx.insert(configAuditLog).values({
        entityType: 'wp_weight_config',
        entityId: config.id,
        action: 'create',
        changedBy,
        oldValue: null,
        newValue: config,
      });
      return config;
    });
  }

  async deleteFutureWithAudit(
    id: string,
    changedBy: string,
  ): Promise<WpWeightConfig | null> {
    return db.transaction(async tx => {
      const [row] = await tx
        .delete(wpWeightConfig)
        .where(and(
          eq(wpWeightConfig.id, id),
          sql`${wpWeightConfig.effectiveDate} > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date`,
        ))
        .returning();
      if (!row) return null;

      const config = rowToConfig(row);
      await tx.insert(configAuditLog).values({
        entityType: 'wp_weight_config',
        entityId: config.id,
        action: 'delete',
        changedBy,
        oldValue: config,
        newValue: null,
      });
      return config;
    });
  }
}
