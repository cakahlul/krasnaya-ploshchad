'use client';
import { useTeamReportFilterStore } from '@src/features/dashboard/store/teamReportFilterStore';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '@src/features/dashboard/repositories/jiraRepository';

export function useTeamReportFetch() {
  const { sprint, project, startDate, endDate } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );
  const selectedTeams = useTeamReportFilterStore(state => state.selectedTeams);

  // Determine if we have valid filter criteria
  const hasSprintFilter = !!sprint;
  const hasDateRangeFilter = !!startDate && !!endDate;
  const hasValidFilter = hasSprintFilter || hasDateRangeFilter;

  return useQuery({
    queryKey: ['teamReport', sprint, startDate, endDate, project, selectedTeams.sort().join(',')],
    queryFn: () => jiraRepository.fetchTeamReport(
      sprint,
      project,
      startDate,
      endDate,
    ),
    enabled: hasValidFilter && !!project && selectedTeams.length > 0,
  });
}
