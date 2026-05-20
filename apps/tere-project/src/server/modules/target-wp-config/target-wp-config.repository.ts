import { db } from '@server/lib/db';
import { targetWpConfig } from '@server/db/schema';
import { desc, eq } from 'drizzle-orm';

export type TargetWpRates = Record<string, number>;

export interface TargetWpConfig {
  id?: string;
  effective_date: string;
  rates: TargetWpRates;
}

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

  async create(effective_date: string, rates: TargetWpRates): Promise<TargetWpConfig> {
    const [row] = await db
      .insert(targetWpConfig)
      .values({ effectiveDate: effective_date, rates })
      .returning();
    return rowToConfig(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(targetWpConfig).where(eq(targetWpConfig.id, id));
  }
}
