import { HolidaysRepository, Holiday } from './holidays.repository';

export class HolidaysService {
  constructor(private readonly repo: HolidaysRepository) {}

  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    return this.repo.fetchHolidaysByYear(year);
  }

  async getNationalHolidays(startDate: Date, endDate: Date): Promise<string[]> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);

    const all = await this.repo.fetchHolidaysForYears(years);

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
