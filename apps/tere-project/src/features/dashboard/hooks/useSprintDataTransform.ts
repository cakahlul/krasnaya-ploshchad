'use client';

import { useMemo } from 'react';
import { useSprintFetch } from './useSprintFetch';
import { SprintDto } from '../types/dashboard';

export interface SprintOption {
  value: number;
  label: string;
  state: string;
  startDate: string;
  endDate: string;
}

export function useSprintDataTransform() {
  const { data, isLoading, error } = useSprintFetch();

  const transformedSprintData: SprintOption[] =
    useMemo(() => {
      if (!data) return [];
      return data.map((sprint: SprintDto) => ({
        value: sprint.id,
        label: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      }));
    }, [data]);

  return {
    sprints: transformedSprintData,
    isLoading,
    error,
  };
}

