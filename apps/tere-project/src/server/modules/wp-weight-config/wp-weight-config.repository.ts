import { db } from '@server/lib/db';
import { wpWeightConfig } from '@server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { AppendixWeightPoint } from '@shared/utils/appendix-level';

export type WpWeights = Record<AppendixWeightPoint, number>;

export interface WpWeightConfig {
  id?: string;
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
    try {
      const rows = await db
        .select()
        .from(wpWeightConfig)
        .orderBy(desc(wpWeightConfig.effectiveDate));
      return rows.map(rowToConfig);
    } catch {
      return [];
    }
  }

  async getEffectiveWeights(sprintStartDate: string): Promise<WpWeights> {
    try {
      const all = await this.fetchAll();
      const match = all
        .filter((c) => c.effective_date <= sprintStartDate)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
      return match?.weights ?? DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  }

  async create(effective_date: string, weights: WpWeights): Promise<WpWeightConfig> {
    const [row] = await db
      .insert(wpWeightConfig)
      .values({ effectiveDate: effective_date, weights })
      .returning();
    return rowToConfig(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(wpWeightConfig).where(eq(wpWeightConfig.id, id));
  }
}
