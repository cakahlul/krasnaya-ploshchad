import { serverCache } from '@server/cache/server-cache';
import { generateOpenSprintReport, getSprintWorkItemStats } from '@server/modules/reports/reports.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { membersService } from '@server/modules/members/members.service';
import * as repo from '@server/modules/reports/reports.repository';
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

      const issues = report?.issues ?? [];
      const memberSummaries = issues.map(issue => ({
        name: issue.member,
        wpProductivity: issue.wpProductivity,
        totalWeightPoints: issue.totalWeightPoints,
        targetWeightPoints: issue.targetWeightPoints,
        spTotal: issue.spTotal ?? 0,
      }));

      // Count unique epics/stories from ALL sprint issues (not just resolved)
      let epicCount = 0;
      const sprintId = report?.sprintId;
      if (sprintId) {
        try {
          const allMembers = await membersService.findAll();
          const teamMembers = allMembers.filter(
            m => m.teams.some(t => t.toLowerCase() === board.shortName.toLowerCase()) && !m.isLead,
          );
          const assignees = teamMembers.map(m => m.id);
          const isSubtaskType = await boardsService.hasSubtaskType(board.shortName);
          const rawIssues = await repo.fetchPlannedWPData(board.shortName, assignees, String(sprintId), isSubtaskType);
          const uniqueParents = new Set(
            rawIssues.filter(i => i.fields.parent?.key).map(i => i.fields.parent!.key),
          );
          epicCount = uniqueParents.size;
        } catch { /* ignore */ }
      }

      return {
        teamName: board.name,
        boardId: board.boardId,
        sprintName: report?.sprintName || null,
        sprintState: report ? 'active' : null,
        sprintStartDate: report?.sprintStartDate || null,
        sprintEndDate: report?.sprintEndDate || null,
        averageProductivity: report?.averageProductivity || null,
        averageWpPerHour: report?.averageWpPerHour || null,
        teamMembers: issues.length,
        memberSummaries,
        totalEpics: epicCount,
        isStoryGrouping: board.isStoryGrouping ?? false,
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
