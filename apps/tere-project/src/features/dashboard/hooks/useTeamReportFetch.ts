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

  // Join epicId array into comma-separated string for the API
  const epicIdParam = epicId && epicId.length > 0 ? epicId.join(',') : undefined;

  return useQuery({
    queryKey: ['teamReport', sprint, startDate, endDate, project, selectedTeams.sort().join(','), epicIdParam],
    queryFn: () => jiraRepository.fetchTeamReport(
      sprint,
      project,
      startDate,
      endDate,
      epicIdParam,
    ),
    enabled: hasValidFilter && !!project && selectedTeams.length > 0,
  });
}
