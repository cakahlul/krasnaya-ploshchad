'use client';
import { useTeamReportFilterStore } from '@src/features/dashboard/store/teamReportFilterStore';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '@src/features/dashboard/repositories/jiraRepository';

export function useTeamReportFetch() {
  const { sprint, project, startDate, endDate, epicId } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );
  const selectedTeams = useTeamReportFilterStore(state => state.selectedTeams);

  // Determine if we have valid filter criteria
  const hasSprintFilter = !!sprint;
  const hasDateRangeFilter = !!startDate && !!endDate;
  const hasValidFilter = hasSprintFilter || hasDateRangeFilter;

  return useQuery({
    // Include both sprint and date range in queryKey for proper cache management
    queryKey: ['teamReport', sprint, startDate, endDate, project, epicId, selectedTeams.sort().join(',')],
    queryFn: () => jiraRepository.fetchTeamReport(
      sprint, 
      project, 
      startDate, 
      endDate,
      epicId ? (Array.isArray(epicId) ? epicId.join(',') : epicId) : undefined
    ),
    enabled: hasValidFilter && !!project && selectedTeams.length > 0,
  });
}
