import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface Holiday {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);
  private readonly baseUrl = 'https://api-harilibur.vercel.app/api';

  /**
   * Fetch national holidays between start and end dates
   * @param startDate Date object
   * @param endDate Date object
   * @returns Array of date strings in YYYY-MM-DD format
   */
  async getNationalHolidays(startDate: Date, endDate: Date): Promise<string[]> {
    try {
      const monthYearPairs: Array<{ month: number; year: number }> = [];
      const current = new Date(startDate);
      // Ensure we don't modify the original date object and handle day overflow issues
      // simply by iterating month by month.
      // However, iterating by date might be safer to cover edge cases, but month-year
      // is efficient for API calls.
      const end = new Date(endDate);

      // Start current at the beginning of the month to avoid skipping months if start date is late in month
      // and we just add month. Actually, `current` is the start date.
      // Let's create a loop that iterates through months.
      const iterator = new Date(current.getFullYear(), current.getMonth(), 1);

      while (iterator <= end || (iterator.getMonth() === end.getMonth() && iterator.getFullYear() === end.getFullYear())) {
        const month = iterator.getMonth() + 1; // 1-12
        const year = iterator.getFullYear();

        if (!monthYearPairs.some((p) => p.month === month && p.year === year)) {
            monthYearPairs.push({ month, year });
        }
        
        // Move to next month
        iterator.setMonth(iterator.getMonth() + 1);
        // Safety check to prevent infinite loop if something goes wrong with date math
        if (iterator.getFullYear() > end.getFullYear() + 1) break;
      }

      const holidayDates: string[] = [];

      for (const { month, year } of monthYearPairs) {
        try {
          const response = await axios.get<Holiday[]>(this.baseUrl, {
            params: { month, year },
          });

          if (response.data && Array.isArray(response.data)) {
            response.data.forEach((holiday) => {
              if (holiday.is_national_holiday) {
                 // Parse holiday date
                 const [hYearStr, hMonthStr, hDayStr] = holiday.holiday_date.split('-');
                 const hYear = parseInt(hYearStr, 10);
                 const hMonth = parseInt(hMonthStr, 10) - 1;
                 const hDay = parseInt(hDayStr, 10);
                 
                 const holidayDate = new Date(hYear, hMonth, hDay);
                 
                 // Check if within range
                 if (holidayDate >= startDate && holidayDate <= endDate) {
                     // Normalize to YYYY-MM-DD
                     const y = holidayDate.getFullYear();
                     const m = String(holidayDate.getMonth() + 1).padStart(2, '0');
                     const d = String(holidayDate.getDate()).padStart(2, '0');
                     holidayDates.push(`${y}-${m}-${d}`);
                 }
              }
            });
          }
        } catch (error) {
          this.logger.error(`Failed to fetch holidays for ${month}/${year}: ${error.message}`);
          // Continue to next month even if one fails
        }
      }

      // Remove duplicates if any (API might return overlapping data if we queried incorrectly, but by month it should be fine. 
      // Safe to dedicate anyway)
      return [...new Set(holidayDates)];

    } catch (error) {
      this.logger.error(`Error fetching national holidays: ${error.message}`);
      return [];
    }
  }
}
