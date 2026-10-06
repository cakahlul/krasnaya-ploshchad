'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axiosClient from '@src/lib/axiosClient';

export interface MemberSummary {
  name: string;
  wpProductivity: string;
  productivityRate: string;
  totalWeightPoints: number;
  targetWeightPoints: number;
  spTotal: number;
}

export interface TeamSummary {
  teamName: string;
  boardId: number;
  sprintName: string | null;
  sprintState: string | null;
  sprintStartDate: string | null;
  sprintEndDate: string | null;
  averageProductivity: string | null;
  averageWpPerHour: number | null;
  teamMembers: number;
  memberSummaries: MemberSummary[];
  totalEpics: number;
  isStoryGrouping: boolean;
  productPercentage: string | null;
  techDebtPercentage: string | null;
  totalWorkingDays: number | null;
  totalWorkItems: number;
  closedWorkItems: number;
  averageHoursOpen: number | null;
}

export interface BugSummary {
  totalBugs: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  averageDaysOpen: number;
}

export interface DashboardSummaryResponse {
  teams: TeamSummary[];
  bugs?: BugSummary;
  generatedAt: string;
}

async function fetchDashboardSummary(startDate?: string, endDate?: string, boardId?: number): Promise<DashboardSummaryResponse> {
  const response = await axiosClient.get('/dashboard/summary', {
    params: { startDate, endDate, boardId },
  });
  return response.data;
}

function getDashboardQueryKey(startDate?: string, endDate?: string, boardIds?: number[]) {
  return ['dashboard-summary', startDate ?? '', endDate ?? '', (boardIds ?? []).join(',')];
}

async function fetchDashboardBugSummary(boardId: number = 177): Promise<BugSummary> {
  const response = await axiosClient.get('/bug-monitoring/summary', {
    params: { boardId },
  });
  return response.data;
}

export function useDashboardSummary(filterBoardIds?: number[], startDate?: string, endDate?: string) {
  const query = useQuery({
    queryKey: getDashboardQueryKey(startDate, endDate, filterBoardIds),
    queryFn: () => fetchDashboardSummary(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const allTeams = query.data?.teams ?? [];
  const filteredTeams = filterBoardIds
    ? allTeams.filter(t => filterBoardIds.includes(t.boardId))
    : allTeams;

  return {
    teams: filteredTeams.map(team => ({
      ...team,
      isLoading: query.isLoading,
      error: query.error as Error | null,
    })),
    generatedAt: query.data?.generatedAt,
    isLoading: query.isLoading,
    error: query.error,
  };
}

const BOARD_BATCH_SIZE = 3;

export function useDashboardSummaries(boardIds: number[], startDate?: string, endDate?: string, enabled = true) {
  const ids = [...new Set(boardIds)].sort((a, b) => a - b);
  const requestKey = `${enabled}:${startDate ?? ''}:${endDate ?? ''}:${ids.join(',')}`;
  const [batchState, setBatchState] = useState({ key: requestKey, count: 1 });
  const batchCount = batchState.key === requestKey ? batchState.count : 1;
  const totalBatches = Math.ceil(ids.length / BOARD_BATCH_SIZE);

  const queries = useQueries({
    queries: ids.map((boardId, index) => ({
      queryKey: ['dashboard-summary', boardId, startDate ?? '', endDate ?? ''],
      queryFn: () => fetchDashboardSummary(startDate, endDate, boardId),
      enabled: enabled && index < batchCount * BOARD_BATCH_SIZE,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    })),
  });
  const activeQueries = queries.slice(0, batchCount * BOARD_BATCH_SIZE);
  const currentBatch = activeQueries.slice((batchCount - 1) * BOARD_BATCH_SIZE);
  const currentBatchFinished = currentBatch.length > 0 && currentBatch.every(query => query.isSuccess || query.isError);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (batchState.key !== requestKey) {
        setBatchState({ key: requestKey, count: 1 });
      } else if (currentBatchFinished && batchCount < totalBatches) {
        setBatchState(state => ({ ...state, count: state.count + 1 }));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [batchCount, batchState.key, currentBatchFinished, requestKey, totalBatches]);

  return {
    teams: queries.flatMap(query => query.data?.teams.slice(0, 1).map(team => ({
      ...team,
      isLoading: query.isPending,
      error: query.error as Error | null,
    })) ?? []),
    isLoading: activeQueries.some(query => query.isPending),
  };
}

export function useDashboardBugSummary(boardId: number = 177, enabled = true) {
  const query = useQuery({
    queryKey: ['dashboard-bug-summary', boardId],
    queryFn: () => fetchDashboardBugSummary(boardId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
    enabled,
  });

  return {
    bugs: {
      totalBugs: query.data?.totalBugs || 0,
      criticalCount: query.data?.criticalCount || 0,
      highCount: query.data?.highCount || 0,
      mediumCount: query.data?.mediumCount || 0,
      lowCount: query.data?.lowCount || 0,
      averageDaysOpen: query.data?.averageDaysOpen || 0,
      isLoading: query.isLoading,
      error: query.error as Error | null,
    } as BugSummary & { isLoading: boolean; error: Error | null },
    isLoading: query.isLoading,
    error: query.error,
  };
}
