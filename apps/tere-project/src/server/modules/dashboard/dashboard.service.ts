import { serverCache } from '@server/cache/server-cache';
import { generateOpenSprintReport, getSprintWorkItemStats } from '@server/modules/reports/reports.service';
import type { DashboardSummaryResponseDto } from '@shared/types/dashboard.types';

const CACHE_KEY = 'dashboard_summary';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getDashboardSummary(): Promise<DashboardSummaryResponseDto> {
  const cached = serverCache.get<DashboardSummaryResponseDto>(CACHE_KEY);
  if (cached) return cached;

  const [dsReport, slsReport, dsWorkItems, slsWorkItems] = await Promise.all([
    generateOpenSprintReport('DS').catch(() => null),
    generateOpenSprintReport('SLS').catch(() => null),
    getSprintWorkItemStats('DS').catch(() => ({ totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null })),
    getSprintWorkItemStats('SLS').catch(() => ({ totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null })),
  ]);

  const response: DashboardSummaryResponseDto = {
    ds: {
      teamName: 'Funding/User (DS)',
      boardId: 143,
      sprintName: dsReport?.sprintName || null,
      sprintState: dsReport ? 'active' : null,
      averageProductivity: dsReport?.averageProductivity || null,
      averageWpPerHour: dsReport?.averageWpPerHour || null,
      teamMembers: dsReport?.issues?.length || 0,
      productPercentage: dsReport?.productPercentage || null,
      techDebtPercentage: dsReport?.techDebtPercentage || null,
      totalWorkingDays: dsReport?.totalWorkingDays || null,
      totalWorkItems: dsWorkItems?.totalWorkItems || 0,
      closedWorkItems: dsWorkItems?.closedWorkItems || 0,
      averageHoursOpen: dsWorkItems?.averageHoursOpen || null,
    },
    sls: {
      teamName: 'Lending/Transaction (SLS)',
      boardId: 142,
      sprintName: slsReport?.sprintName || null,
      sprintState: slsReport ? 'active' : null,
      averageProductivity: slsReport?.averageProductivity || null,
      averageWpPerHour: slsReport?.averageWpPerHour || null,
      teamMembers: slsReport?.issues?.length || 0,
      productPercentage: slsReport?.productPercentage || null,
      techDebtPercentage: slsReport?.techDebtPercentage || null,
      totalWorkingDays: slsReport?.totalWorkingDays || null,
      totalWorkItems: slsWorkItems?.totalWorkItems || 0,
      closedWorkItems: slsWorkItems?.closedWorkItems || 0,
      averageHoursOpen: slsWorkItems?.averageHoursOpen || null,
    },
    generatedAt: new Date().toISOString(),
  };

  serverCache.set(CACHE_KEY, response, CACHE_TTL_MS);
  return response;
}
