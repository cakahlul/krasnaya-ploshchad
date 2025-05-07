'use client';
import { useTeamReportFilterStore } from '@src/features/dashboard/store/useTeamReportFilterStore';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '@src/features/dashboard/repositories/jiraRepository';
import { useEffect } from 'react';

export function useTeamReportFetch() {
  const { sprint, project } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );

  const setSelectedFilter = useTeamReportFilterStore(
    state => state.setSelectedFilter,
  );

  useEffect(() => {
    // ✅ Set the filter only once after mount
    setSelectedFilter({ sprint: '3517', project: 'SLS' });
  }, [setSelectedFilter]);

  return useQuery({
    queryKey: ['teamReport', sprint],
    queryFn: () => jiraRepository.fetchTeamReport(sprint, project),
    enabled: !!sprint,
  });
}
