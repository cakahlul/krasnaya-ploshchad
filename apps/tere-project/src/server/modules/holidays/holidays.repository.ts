import { db } from '@server/lib/db';
import { holidays } from '@server/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

export interface Holiday {
  id?: string;
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

type Row = typeof holidays.$inferSelect;

function rowToHoliday(row: Row): Holiday {
  return {
    id: row.id,
    holiday_date: row.date,
    holiday_name: row.name,
    is_national_holiday: row.isNationalHoliday,
  };
}

export class HolidaysRepository {
  async fetchHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      const rows = await db
        .select()
        .from(holidays)
        .where(and(gte(holidays.date, `${year}-01-01`), lte(holidays.date, `${year}-12-31`)));
      return rows.map(rowToHoliday);
    } catch {
      return [];
    }
  }

  async fetchHolidaysForYears(years: number[]): Promise<Holiday[]> {
    if (!years.length) return [];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    try {
      const rows = await db
        .select()
        .from(holidays)
        .where(and(gte(holidays.date, `${minYear}-01-01`), lte(holidays.date, `${maxYear}-12-31`)));
      return rows.map(rowToHoliday).filter((h) => {
        const y = parseInt(h.holiday_date.substring(0, 4), 10);
        return years.includes(y);
      });
    } catch {
      return [];
    }
  }

  async createHoliday(date: string, name: string): Promise<Holiday> {
    const [row] = await db
      .insert(holidays)
      .values({ date, name, isNationalHoliday: true })
      .returning();
    return rowToHoliday(row);
  }

  async deleteHoliday(id: string): Promise<void> {
    await db.delete(holidays).where(eq(holidays.id, id));
  }
}
