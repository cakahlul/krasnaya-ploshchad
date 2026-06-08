import { serverCache } from '@server/cache/server-cache';
import { generateOpenSprintReport, generateReportByDateRange, getSprintWorkItemStats } from '@server/modules/reports/reports.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { membersService } from '@server/modules/members/members.service';
import * as repo from '@server/modules/reports/reports.repository';
import { getKanbanDateRange } from '@shared/utils/kanban-cycle.util';
import type { DashboardSummaryResponseDto } from '@shared/types/dashboard.types';

const CACHE_KEY = 'dashboard_summary';
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getDashboardSummary(
  requestedStartDate?: string,
  requestedEndDate?: string,
): Promise<DashboardSummaryResponseDto> {
  const defaultRange = getKanbanDateRange();
  const startDate = requestedStartDate ?? defaultRange.startDate;
  const endDate = requestedEndDate ?? defaultRange.endDate;
  const cacheKey = `${CACHE_KEY}_${startDate}_${endDate}`;
  const cached = serverCache.get<DashboardSummaryResponseDto>(cacheKey);
  if (cached) return cached;

  const allBoards = await boardsService.findAll();
  const boards = allBoards.filter(b => !b.isBugMonitoring);

  const teams = await Promise.all(
    boards.map(async (board) => {
      if (board.isKanban) {
        const boardRange = requestedStartDate && requestedEndDate
          ? { startDate, endDate }
          : getKanbanDateRange(undefined, board.kanbanCycleStartDate ?? undefined);
        const report = await generateReportByDateRange(boardRange.startDate, boardRange.endDate, board.shortName).catch(() => null);
        const issues = report?.issues ?? [];
        const uniqueParents = new Set(
          issues.flatMap(issue => issue.epicKeys?.filter(key => key !== 'null') ?? []),
        );

        return {
          teamName: board.name,
          boardId: board.boardId,
          sprintName: 'Kanban Cycle',
          sprintState: null,
          sprintStartDate: boardRange.startDate,
          sprintEndDate: boardRange.endDate,
          averageProductivity: report?.averageProductivity || null,
          averageWpPerHour: report?.averageWpPerHour || null,
          teamMembers: issues.length,
          memberSummaries: issues.map(issue => ({
            name: issue.member,
            wpProductivity: issue.wpProductivity,
            totalWeightPoints: issue.totalWeightPoints,
            targetWeightPoints: issue.targetWeightPoints,
            spTotal: issue.spTotal ?? 0,
          })),
          totalEpics: uniqueParents.size,
          isStoryGrouping: board.isStoryGrouping ?? false,
          productPercentage: report?.productPercentage || null,
          techDebtPercentage: report?.techDebtPercentage || null,
          totalWorkingDays: report?.totalWorkingDays || null,
          totalWorkItems: issues.reduce((sum, issue) => sum + issue.issueKeys.length, 0),
          closedWorkItems: issues.reduce((sum, issue) => sum + issue.issueKeys.length, 0),
          averageHoursOpen: null,
        };
      }

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

      let epicCount = 0;
      const sprintId = report?.sprintId;
      if (sprintId) {
        try {
          const allMembers = await membersService.findAll();
          const teamMembers = allMembers.filter(
            m => m.teams.some(t => t.toLowerCase() === board.shortName.toLowerCase()) && !m.isLead,
          );
          const assignees = teamMembers.map(m => m.jiraId!).filter(Boolean);
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

  serverCache.set(cacheKey, response, CACHE_TTL_MS);
  return response;
}
