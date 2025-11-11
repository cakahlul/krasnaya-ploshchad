'use client';
import { useQuery } from '@tanstack/react-query';
import { googleCalendarClient } from '@src/lib/googleCalendar';

/**
 * Custom hook to fetch Indonesian public holidays using React Query
 * Fetches holidays from Google Calendar API for the specified date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns React Query result with holidays data
 */
export function useHolidays(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['holidays', startDate, endDate],
    queryFn: () => googleCalendarClient.fetchHolidays(startDate, endDate),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    retry: 1, // Only retry once on failure
  });
}
