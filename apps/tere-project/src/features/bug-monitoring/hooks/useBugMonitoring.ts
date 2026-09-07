'use client';

import { useQuery } from '@tanstack/react-query';
import { bugMonitoringApi } from '../api/bug-monitoring.api';
import { BugMonitoringData } from '../types/bug-monitoring.types';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';

export function useBugMonitoring(boardId?: number, nocP1CodeIssue = false) {
  const { member, isLoading: profileLoading } = useMemberProfile();
  const isLead = member?.isLead ?? false;

  return useQuery<BugMonitoringData>({
    queryKey: ['bug-monitoring', boardId ?? 'all', nocP1CodeIssue],
    queryFn: () => bugMonitoringApi.getBugs(boardId, nocP1CodeIssue),
    refetchInterval: isLead ? 5 * 60 * 1000 : false,
    staleTime: 2 * 60 * 1000,
    enabled: !profileLoading && isLead,
  });
}
