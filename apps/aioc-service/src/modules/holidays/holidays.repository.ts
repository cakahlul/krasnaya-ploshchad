import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Response format from the external holiday API (libur.deno.dev)
 */
interface ExternalHolidayResponse {
  date: string;   // e.g., "2026-01-01"
  name: string;   // e.g., "Tahun Baru 2026 Masehi"
}

/**
 * Internal holiday interface used in business logic
 */
export interface Holiday {
  holiday_date: string;      // e.g., "2026-01-01"
  holiday_name: string;      // e.g., "Tahun Baru 2026 Masehi"
  is_national_holiday: boolean;  // true for national holidays (defaults to true)
}

@Injectable()
export class HolidaysRepository {
  private readonly logger = new Logger(HolidaysRepository.name);
  private readonly baseUrl = 'https://libur.deno.dev/api';
  
  // Cache to store fetched holidays by year
  private readonly cache = new Map<number, Holiday[]>();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly cacheTimestamps = new Map<number, number>();

  /**
   * Fetch holidays for a specific year from the external API
   * @param year The year to fetch holidays for
   * @returns Array of Holiday objects
   */
  async fetchHolidaysByYear(year: number): Promise<Holiday[]> {
    // Check cache first
    const cachedData = this.cache.get(year);
    const cacheTimestamp = this.cacheTimestamps.get(year);
    
    if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp) < this.cacheTTL) {
      this.logger.debug(`Using cached holidays for year ${year}`);
      return cachedData;
    }

    try {
      this.logger.log(`Fetching holidays for year ${year} from external API`);
      
      const response = await axios.get<ExternalHolidayResponse[]>(this.baseUrl, {
        params: { year },
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data)) {
        this.logger.warn(`Invalid response format from holiday API for year ${year}`);
        return [];
      }

      // Transform external API response to internal Holiday format
      const holidays: Holiday[] = response.data.map((item) => ({
        holiday_date: item.date,
        holiday_name: item.name,
        // Default to true if is_national_holiday is not provided by the API
        is_national_holiday: true,
      }));

      // Update cache
      this.cache.set(year, holidays);
      this.cacheTimestamps.set(year, Date.now());

      this.logger.log(`Fetched ${holidays.length} holidays for year ${year}`);
      return holidays;

    } catch (error) {
      this.logger.error(`Failed to fetch holidays for year ${year}: ${error.message}`);
      
      // Return cached data if available, even if expired
      if (cachedData) {
        this.logger.warn(`Using expired cache for year ${year}`);
        return cachedData;
      }
      
      return [];
    }
  }

  /**
   * Fetch holidays for multiple years
   * @param years Array of years to fetch
   * @returns Array of all holidays across the specified years
   */
  async fetchHolidaysForYears(years: number[]): Promise<Holiday[]> {
    const uniqueYears = [...new Set(years)];
    const allHolidays: Holiday[] = [];

    for (const year of uniqueYears) {
      const holidays = await this.fetchHolidaysByYear(year);
      allHolidays.push(...holidays);
    }

    return allHolidays;
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.logger.log('Holiday cache cleared');
  }
}
