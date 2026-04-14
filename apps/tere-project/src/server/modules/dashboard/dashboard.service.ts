import { serverCache } from '@server/cache/server-cache';
import { generateOpenSprintReport, getSprintWorkItemStats } from '@server/modules/reports/reports.service';
import { boardsService } from '@server/modules/boards/boards.service';
import type { DashboardSummaryResponseDto } from '@shared/types/dashboard.types';

const CACHE_KEY = 'dashboard_summary';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getDashboardSummary(): Promise<DashboardSummaryResponseDto> {
  const cached = serverCache.get<DashboardSummaryResponseDto>(CACHE_KEY);
  if (cached) return cached;

  const allBoards = await boardsService.findAll();
  const boards = allBoards.filter(b => !b.isBugMonitoring);

  const teams = await Promise.all(
    boards.map(async (board) => {
      const [report, workItems] = await Promise.all([
        generateOpenSprintReport(board.shortName).catch(() => null),
        getSprintWorkItemStats(board.shortName).catch(() => ({ totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null })),
      ]);

      return {
        teamName: board.name,
        boardId: board.boardId,
        sprintName: report?.sprintName || null,
        sprintState: report ? 'active' : null,
        averageProductivity: report?.averageProductivity || null,
        averageWpPerHour: report?.averageWpPerHour || null,
        teamMembers: report?.issues?.length || 0,
        productPercentage: report?.productPercentage || null,
        techDebtPercentage: report?.techDebtPercentage || null,
        totalWorkingDays: report?.totalWorkingDays || null,
        totalWorkItems: workItems?.totalWorkItems || 0,
        closedWorkItems: workItems?.closedWorkItems || 0,
        averageHoursOpen: workItems?.averageHoursOpen || null,
      };
    }),
  );

  const response: DashboardSummaryResponseDto = {
    teams,
    generatedAt: new Date().toISOString(),
  };

  serverCache.set(CACHE_KEY, response, CACHE_TTL_MS);
  return response;
}
