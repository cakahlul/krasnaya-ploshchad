'use client';
import { jiraRepository } from '../repositories/jiraRepository';
import { useQuery } from '@tanstack/react-query';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';

export function useMultiTeamSprintFetch() {
  const selectedTeams = useTeamReportFilterStore(state => state.selectedTeams);

  return useQuery({
    queryKey: ['sprints-multi', selectedTeams.sort().join(',')],
    queryFn: () => 
      selectedTeams.length > 0
        ? jiraRepository.fetchSprintsByBoardIds(selectedTeams)
        : Promise.resolve([]),
    enabled: selectedTeams.length > 0,
  });
}
