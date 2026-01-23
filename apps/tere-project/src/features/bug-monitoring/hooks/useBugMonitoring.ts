'use client';

import { useQuery } from '@tanstack/react-query';
import { bugMonitoringApi } from '../api/bug-monitoring.api';
import { BugMonitoringData } from '../types/bug-monitoring.types';

export function useBugMonitoring(boardId: number) {
  return useQuery<BugMonitoringData>({
    queryKey: ['bug-monitoring', boardId],
    queryFn: () => bugMonitoringApi.getBugs(boardId),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}
