'use client';
import { useQuery } from '@tanstack/react-query';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';

/**
 * Custom hook to fetch talent list using React Query
 * Fetches the list of all talents with their team and role information
 * @returns React Query result with talent list data
 */
export function useTalentList() {
  return useQuery({
    queryKey: ['talentList'],
    queryFn: () => talentLeaveRepository.fetchTalentList(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
