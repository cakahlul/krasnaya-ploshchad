'use client';
import { useQuery } from '@tanstack/react-query';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';
import { useTalentLeaveStore } from '../store/talentLeaveStore';

/**
 * Custom hook to fetch talent list using React Query
 * Fetches talents active during the visible leave-calendar range.
 * @returns React Query result with talent list data
 */
export function useTalentList() {
  const { dateRangeStart, dateRangeEnd } = useTalentLeaveStore();
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };
  const startDate = formatDate(dateRangeStart);
  const endDate = formatDate(dateRangeEnd);

  return useQuery({
    queryKey: ['talentList', startDate, endDate],
    queryFn: () => talentLeaveRepository.fetchTalentList(startDate, endDate),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
