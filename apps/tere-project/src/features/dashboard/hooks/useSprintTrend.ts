'use client';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '../repositories/jiraRepository';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';

export function useSprintTrend() {
  const { project } = useTeamReportFilterStore(state => state.selectedFilter);
  const selectedSprints = useTeamReportFilterStore(state => state.selectedSprints);

  const sprintsKey = [...selectedSprints].sort().join(',');
  const enabled = !!project && selectedSprints.length >= 2;

  return useQuery({
    queryKey: ['sprintTrend', project, sprintsKey],
    queryFn: () => jiraRepository.fetchSprintTrend(selectedSprints, project),
    enabled,
  });
}
