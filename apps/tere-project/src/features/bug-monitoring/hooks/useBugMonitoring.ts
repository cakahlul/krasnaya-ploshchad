'use client';

import { useQuery } from '@tanstack/react-query';
import { bugMonitoringApi } from '../api/bug-monitoring.api';
import { BugMonitoringData } from '../types/bug-monitoring.types';
import { useUserAccess } from '@src/hooks/useUserAccess';

export function useBugMonitoring(boardId: number) {
  const { role, isLoading: roleLoading } = useUserAccess();
  const isLead = role === 'Lead';

  return useQuery<BugMonitoringData>({
    queryKey: ['bug-monitoring', boardId],
    queryFn: () => bugMonitoringApi.getBugs(boardId),
    refetchInterval: isLead ? 5 * 60 * 1000 : false,
    staleTime: 2 * 60 * 1000,
    enabled: !roleLoading && isLead,
  });
}
