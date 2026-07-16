import { db } from '@server/lib/db';
import { configAuditLog, holidays } from '@server/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import {
  fetchConfigAuditLog,
  type AuditCursor,
  type AuditLogEntry,
} from '@server/modules/config-audit-log';

export interface Holiday {
  id?: string;
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

export type HolidayAuditCursor = AuditCursor;
export type HolidayAuditEntry = AuditLogEntry<Holiday>;

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

  async findById(id: string): Promise<Holiday | null> {
    const [row] = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id))
      .limit(1);
    return row ? rowToHoliday(row) : null;
  }

  async createWithAudit(date: string, name: string, changedBy: string): Promise<Holiday> {
    return db.transaction(async tx => {
      const [row] = await tx
        .insert(holidays)
        .values({ date, name, isNationalHoliday: true })
        .returning();
      const holiday = rowToHoliday(row);
      await tx.insert(configAuditLog).values({
        entityType: 'holiday',
        entityId: holiday.id!,
        action: 'create',
        changedBy,
        oldValue: null,
        newValue: holiday,
      });
      return holiday;
    });
  }

  async createManyWithAudit(
    items: { date: string; name: string }[],
    changedBy: string,
  ): Promise<Holiday[]> {
    return db.transaction(async tx => {
      const created: Holiday[] = [];
      for (const item of items) {
        const [row] = await tx
          .insert(holidays)
          .values({ date: item.date, name: item.name, isNationalHoliday: true })
          .returning();
        const holiday = rowToHoliday(row);
        await tx.insert(configAuditLog).values({
          entityType: 'holiday',
          entityId: holiday.id!,
          action: 'create',
          changedBy,
          oldValue: null,
          newValue: holiday,
        });
        created.push(holiday);
      }
      return created;
    });
  }

  async deleteFutureWithAudit(id: string, changedBy: string): Promise<Holiday | null> {
    return db.transaction(async tx => {
      const [row] = await tx
        .delete(holidays)
        .where(and(
          eq(holidays.id, id),
          sql`${holidays.date} > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date`,
        ))
        .returning();
      if (!row) return null;

      const holiday = rowToHoliday(row);
      await tx.insert(configAuditLog).values({
        entityType: 'holiday',
        entityId: holiday.id!,
        action: 'delete',
        changedBy,
        oldValue: holiday,
        newValue: null,
      });
      return holiday;
    });
  }

  async fetchAuditLog(cursor: HolidayAuditCursor | null): Promise<HolidayAuditEntry[]> {
    return fetchConfigAuditLog<Holiday>('holiday', cursor);
  }
}
