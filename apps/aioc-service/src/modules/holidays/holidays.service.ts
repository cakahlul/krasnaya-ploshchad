import { Injectable, Logger } from '@nestjs/common';
import { HolidaysRepository, Holiday } from './holidays.repository';

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(private readonly holidaysRepository: HolidaysRepository) {}

  /**
   * Get all holidays for a specific year
   * @param year The year to get holidays for
   * @returns Array of Holiday objects
   */
  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    return this.holidaysRepository.fetchHolidaysByYear(year);
  }

  /**
   * Fetch national holidays between start and end dates
   * @param startDate Date object
   * @param endDate Date object
   * @returns Array of date strings in YYYY-MM-DD format
   */
  async getNationalHolidays(startDate: Date, endDate: Date): Promise<string[]> {
    try {
      // Get all years in the date range
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const years: number[] = [];
      
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }

      // Fetch holidays for all years in range
      const allHolidays = await this.holidaysRepository.fetchHolidaysForYears(years);

      // Filter holidays within the date range and that are national holidays
      const holidayDates: string[] = [];

      for (const holiday of allHolidays) {
        // Only include national holidays
        if (!holiday.is_national_holiday) {
          continue;
        }

        // Parse the holiday date
        const [hYearStr, hMonthStr, hDayStr] = holiday.holiday_date.split('-');
        const hYear = parseInt(hYearStr, 10);
        const hMonth = parseInt(hMonthStr, 10) - 1; // Month is 0-indexed
        const hDay = parseInt(hDayStr, 10);

        const holidayDate = new Date(hYear, hMonth, hDay);

        // Check if within the requested date range
        if (holidayDate >= startDate && holidayDate <= endDate) {
          // Normalize to YYYY-MM-DD format
          const y = holidayDate.getFullYear();
          const m = String(holidayDate.getMonth() + 1).padStart(2, '0');
          const d = String(holidayDate.getDate()).padStart(2, '0');
          holidayDates.push(`${y}-${m}-${d}`);
        }
      }

      // Remove duplicates and return
      return [...new Set(holidayDates)];

    } catch (error) {
      this.logger.error(`Error fetching national holidays: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if a specific date is a national holiday
   * @param date The date to check
   * @returns true if the date is a national holiday
   */
  async isNationalHoliday(date: Date): Promise<boolean> {
    const holidays = await this.getNationalHolidays(date, date);
    return holidays.length > 0;
  }

  /**
   * Get holiday details for a specific date
   * @param date The date to check
   * @returns Holiday object if found, null otherwise
   */
  async getHolidayDetails(date: Date): Promise<Holiday | null> {
    const year = date.getFullYear();
    const holidays = await this.holidaysRepository.fetchHolidaysByYear(year);
    
    const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return holidays.find(h => h.holiday_date === dateStr) || null;
  }
}
