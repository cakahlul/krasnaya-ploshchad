'use client';
import { useQuery } from '@tanstack/react-query';
import { holidayApi } from '@src/features/holiday-management/api/holiday.api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

/**
 * Custom hook to fetch global system holidays using React Query
 * Maps the global Holiday type to the Talent Leave Holiday type and filters by range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns React Query result with filtered holidays data
 */
export function useHolidays(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['holidays', startDate, endDate],
    queryFn: async () => {
      // 1. Fetch all system holidays
      const allHolidays = await holidayApi.fetchHolidays();
      
      // 2. Filter by date range and map to the format Talent Leave expects
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      
      return allHolidays
        .filter(h => dayjs(h.holiday_date).isBetween(start, end, 'day', '[]'))
        .map(h => ({
          date: dayjs(h.holiday_date).format('YYYY-MM-DD'),
          name: h.holiday_name,
          isNational: h.is_national_holiday
        }));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes instead of 24h since we can now edit them
    retry: 1, 
  });
}
