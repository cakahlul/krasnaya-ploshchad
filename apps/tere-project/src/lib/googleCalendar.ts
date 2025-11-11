import type { Holiday } from '@src/features/talent-leave/types/talent-leave.types';

export const googleCalendarClient = {
  /**
   * Fetch Indonesian public holidays from Google Calendar API via Next.js API route
   * This approach keeps the API key secure on the server side
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of holidays within the date range
   */
  fetchHolidays: async (
    startDate: string,
    endDate: string
  ): Promise<Holiday[]> => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`/api/holidays?${params.toString()}`);

      if (!response.ok) {
        console.error('Failed to fetch holidays:', response.status);
        return [];
      }

      const holidays = await response.json();

      if (holidays.length > 0) {
        console.log(`Fetched ${holidays.length} holidays from Google Calendar`);
      }

      return holidays;
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      return [];
    }
  },
};
