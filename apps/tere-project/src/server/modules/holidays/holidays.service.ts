import { HolidaysRepository, Holiday } from './holidays.repository';
import { MemoryCache } from '@server/lib/cache';

export class HolidaysService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repo: HolidaysRepository) {}

  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    return this.repo.fetchHolidaysByYear(year);
  }

  async createHoliday(date: string, name: string): Promise<Holiday> {
    this.cache.invalidate();
    return this.repo.createHoliday(date, name);
  }

  async bulkCreateHolidays(holidays: { date: string; name: string }[]): Promise<{ count: number }> {
    this.cache.invalidate();
    await Promise.all(holidays.map((h) => this.repo.createHoliday(h.date, h.name)));
    return { count: holidays.length };
  }

  async deleteHoliday(id: string): Promise<void> {
    this.cache.invalidate();
    return this.repo.deleteHoliday(id);
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
