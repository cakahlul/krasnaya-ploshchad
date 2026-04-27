'use client';

import { useQuery } from '@tanstack/react-query';
import { bugMonitoringApi } from '../api/bug-monitoring.api';
import { BugMonitoringData } from '../types/bug-monitoring.types';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';

export function useBugMonitoring(boardId: number) {
  const { member, isLoading: profileLoading } = useMemberProfile();
  const isLead = member?.isLead ?? false;

  return useQuery<BugMonitoringData>({
    queryKey: ['bug-monitoring', boardId],
    queryFn: () => bugMonitoringApi.getBugs(boardId),
    refetchInterval: isLead ? 5 * 60 * 1000 : false,
    staleTime: 2 * 60 * 1000,
    enabled: !profileLoading && isLead,
  });
}
