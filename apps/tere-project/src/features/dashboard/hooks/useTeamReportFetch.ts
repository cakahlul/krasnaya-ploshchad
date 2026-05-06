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
    // epicId intentionally excluded from queryKey — epic filtering is now client-side via useMemo.
    // Changing the epic selection does NOT trigger a new network request.
    queryKey: ['teamReport', sprint, startDate, endDate, project, selectedTeams.sort().join(',')],
    queryFn: () => jiraRepository.fetchTeamReport(
      sprint,
      project,
      startDate,
      endDate,
      // No epicId passed — server returns full unfiltered dataset; client filters via useTeamReportTransform
    ),
    enabled: hasValidFilter && !!project && selectedTeams.length > 0,
  });
}
