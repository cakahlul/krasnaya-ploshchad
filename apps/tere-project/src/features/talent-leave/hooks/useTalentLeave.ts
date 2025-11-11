'use client';
import { useQuery } from '@tanstack/react-query';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';

/**
 * Custom hook to fetch leave records using React Query
 * Fetches leave records for a 2-month period starting from selectedMonthStart
 * @returns React Query result with leave records data
 */
export function useTalentLeave() {
  const { selectedMonthStart } = useTalentLeaveStore();

  // Calculate date range (2 months from selectedMonthStart)
  const startDate = selectedMonthStart
    ? (() => {
        const year = selectedMonthStart.getFullYear();
        const month = String(selectedMonthStart.getMonth() + 1).padStart(2, '0');
        const day = String(selectedMonthStart.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })()
    : '';

  const endDate = selectedMonthStart
    ? (() => {
        const end = new Date(selectedMonthStart);
        end.setMonth(end.getMonth() + 2);
        end.setDate(0); // Last day of the second month
        const year = end.getFullYear();
        const month = String(end.getMonth() + 1).padStart(2, '0');
        const day = String(end.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })()
    : '';

  return useQuery({
    queryKey: ['talentLeave', selectedMonthStart],
    queryFn: () => talentLeaveRepository.fetchLeaveRecords(startDate, endDate),
    enabled: !!selectedMonthStart,
  });
}
