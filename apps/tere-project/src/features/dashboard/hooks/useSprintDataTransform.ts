'use client';

import { useMemo } from 'react';
import { useSprintFetch } from './useSprintFetch';
import { SprintDto } from '../types/dashboard';

export function useSprintDataTransform() {
  const { data, isLoading, error } = useSprintFetch();

  const transformedSprintData: { value: number; label: string }[] =
    useMemo(() => {
      if (!data) return [];
      return data.map((sprint: SprintDto) => ({
        value: sprint.id,
        label: sprint.name,
      }));
    }, [data]);

  return {
    sprints: transformedSprintData,
    isLoading,
    error,
  };
}
