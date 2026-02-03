'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

export interface TeamSummary {
  teamName: string;
  boardId: number;
  sprintName: string | null;
  sprintState: string | null;
  averageProductivity: string | null;
  averageWpPerHour: number | null;
  teamMembers: number;
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
  ds: TeamSummary;
  sls: TeamSummary;
  bugs: BugSummary;
  generatedAt: string;
}

async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await axiosClient.get(`${apiUrl}/dashboard/summary`);
  return response.data;
}

export function useDashboardSummary() {
  const query = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return {
    ds: {
      ...query.data?.ds,
      teamName: query.data?.ds?.teamName || 'Funding (DS)',
      isLoading: query.isLoading,
      error: query.error as Error | null,
    } as TeamSummary & { isLoading: boolean; error: Error | null },
    sls: {
      ...query.data?.sls,
      teamName: query.data?.sls?.teamName || 'Lending (SLS)',
      isLoading: query.isLoading,
      error: query.error as Error | null,
    } as TeamSummary & { isLoading: boolean; error: Error | null },
    bugs: {
      totalBugs: query.data?.bugs?.totalBugs || 0,
      criticalCount: query.data?.bugs?.criticalCount || 0,
      highCount: query.data?.bugs?.highCount || 0,
      mediumCount: query.data?.bugs?.mediumCount || 0,
      lowCount: query.data?.bugs?.lowCount || 0,
      averageDaysOpen: query.data?.bugs?.averageDaysOpen || 0,
      isLoading: query.isLoading,
      error: query.error as Error | null,
    } as BugSummary & { isLoading: boolean; error: Error | null },
    generatedAt: query.data?.generatedAt,
    isLoading: query.isLoading,
    error: query.error,
  };
}
