import {
  HolidaysRepository,
  type Holiday,
  type HolidayAuditEntry,
} from './holidays.repository';
import { MemoryCache } from '@server/lib/cache';
import { decodeAuditCursor, paginate, InvalidAuditCursorError } from '@server/modules/config-audit-log';

export type HolidaysErrorCode = 'VALIDATION_ERROR' | 'IMMUTABLE_CONFIG' | 'HOLIDAY_NOT_FOUND';

export class HolidaysError extends Error {
  constructor(
    readonly code: HolidaysErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Repository = Pick<
  HolidaysRepository,
  | 'fetchHolidaysByYear'
  | 'fetchHolidaysForYears'
  | 'fetchAuditLog'
  | 'findById'
  | 'createWithAudit'
  | 'createManyWithAudit'
  | 'deleteFutureWithAudit'
>;

export class HolidaysService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repo: Repository) {}

  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    return this.repo.fetchHolidaysByYear(year);
  }

  async createHoliday(date: string, name: string, changedBy: string): Promise<Holiday> {
    if (!date || !name) {
      throw new HolidaysError('VALIDATION_ERROR', 'Invalid holiday input', 400, {
        ...(date ? {} : { date: 'Required' }),
        ...(name ? {} : { name: 'Required' }),
      });
    }
    this.cache.invalidate();
    return this.repo.createWithAudit(date, name, changedBy);
  }

  async bulkCreateHolidays(
    items: { date: string; name: string }[],
    changedBy: string,
  ): Promise<{ count: number }> {
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => !item.date || !item.name)) {
      throw new HolidaysError('VALIDATION_ERROR', 'Invalid bulk holiday input', 400);
    }
    this.cache.invalidate();
    const created = await this.repo.createManyWithAudit(items, changedBy);
    return { count: created.length };
  }

  async deleteHoliday(id: string, changedBy: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) {
      throw new HolidaysError('HOLIDAY_NOT_FOUND', 'Holiday not found', 404);
    }
    this.cache.invalidate();
    if (await this.repo.deleteFutureWithAudit(id, changedBy)) return;

    if (await this.repo.findById(id)) {
      throw new HolidaysError('IMMUTABLE_CONFIG', 'Only future holidays can be deleted', 409);
    }
    throw new HolidaysError('HOLIDAY_NOT_FOUND', 'Holiday not found', 404);
  }

  async fetchAuditLog(cursor: string | null): Promise<{
    items: HolidayAuditEntry[];
    next_cursor: string | null;
  }> {
    let decoded = null;
    if (cursor !== null) {
      try {
        decoded = decodeAuditCursor(cursor);
      } catch (error) {
        if (error instanceof InvalidAuditCursorError) {
          throw new HolidaysError('VALIDATION_ERROR', 'Invalid audit cursor', 400, { cursor: 'Invalid cursor' });
        }
        throw error;
      }
    }
    const rows = await this.repo.fetchAuditLog(decoded);
    return paginate(rows);
  }

  async getNationalHolidays(startDate: Date, endDate: Date): Promise<string[]> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);

    const cacheKey = `holidays_${years.join(',')}`;
    const cachedAll = this.cache.get<Holiday[]>(cacheKey);
    const all = cachedAll ?? await this.repo.fetchHolidaysForYears(years);
    if (!cachedAll) this.cache.set(cacheKey, all);

    const results: string[] = [];
    for (const h of all) {
      if (!h.is_national_holiday) continue;
      const [yStr, mStr, dStr] = h.holiday_date.split('-');
      const hDate = new Date(+yStr, +mStr - 1, +dStr);
      if (hDate >= startDate && hDate <= endDate) {
        results.push(
          `${hDate.getFullYear()}-${String(hDate.getMonth() + 1).padStart(2, '0')}-${String(hDate.getDate()).padStart(2, '0')}`,
        );
      }
    }

    return [...new Set(results)];
  }
}

export const holidaysService = new HolidaysService(new HolidaysRepository());
