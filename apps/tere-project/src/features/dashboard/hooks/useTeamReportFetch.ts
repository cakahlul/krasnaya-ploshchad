'use client';
import { useTeamReportFilterStore } from '@src/features/dashboard/store/teamReportFilterStore';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '@src/features/dashboard/repositories/jiraRepository';

export function useTeamReportFetch() {
  const { sprint, project } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );

  return useQuery({
    queryKey: ['teamReport', sprint],
    queryFn: () => jiraRepository.fetchTeamReport(sprint, project),
    enabled: !!sprint,
  });
}
