'use client';

import { useMemo } from 'react';
import { useMultiTeamSprintFetch } from './useMultiTeamSprintFetch';
import { SprintDto } from '../types/dashboard';
import { SprintOption } from './useSprintDataTransform';

export function useMultiSprintDataTransform() {
  const { data, isLoading, error } = useMultiTeamSprintFetch();

  const transformedSprintData: SprintOption[] = useMemo(() => {
    if (!data) return [];
    return data.map((sprint: SprintDto) => ({
      value: sprint.id,
      label: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      boardId: sprint.boardId || sprint.originBoardId,
    }));
  }, [data]);

  return {
    sprints: transformedSprintData,
    isLoading,
    error,
  };
}
