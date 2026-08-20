import { serverCache } from '@server/cache/server-cache';
import { filterReportMembersForProject, generateOpenSprintReport, generateReportByDateRange, getSprintWorkItemStats } from '@server/modules/reports/reports.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { membersService } from '@server/modules/members/members.service';
import * as repo from '@server/modules/reports/reports.repository';
import { getKanbanDateRange } from '@shared/utils/kanban-cycle.util';
import type { DashboardSummaryResponseDto } from '@shared/types/dashboard.types';

const CACHE_KEY = 'dashboard_summary';
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getDashboardBoardIdsForMember(
  member: { isLead?: boolean; teams: readonly string[] },
  boards: readonly { boardId: number; shortName: string; isBugMonitoring?: boolean }[],
): number[] | undefined {
  if (member.isLead) return undefined;

  const teams = new Set(member.teams.map(team => team.trim().toLowerCase()));
  return boards
    .filter(board => !board.isBugMonitoring && teams.has(board.shortName.toLowerCase()))
    .map(board => board.boardId);
}

export function toDashboardMemberSummary(issue: {
  member: string;
  wpProductivity: string;
  productivityRate: string;
  totalWeightPoints: number;
  targetWeightPoints: number;
  spTotal?: number;
}) {
  return {
    name: issue.member,
    wpProductivity: issue.wpProductivity,
    productivityRate: issue.productivityRate,
    totalWeightPoints: issue.totalWeightPoints,
    targetWeightPoints: issue.targetWeightPoints,
    spTotal: issue.spTotal ?? 0,
  };
}

export async function getDashboardSummary(
  requestedStartDate?: string,
  requestedEndDate?: string,
  allowedBoardIds?: readonly number[],
): Promise<DashboardSummaryResponseDto> {
  const defaultRange = getKanbanDateRange();
  const startDate = requestedStartDate ?? defaultRange.startDate;
  const endDate = requestedEndDate ?? defaultRange.endDate;
  const scopeKey = allowedBoardIds === undefined
    ? 'all'
    : [...allowedBoardIds].sort((a, b) => a - b).join(',');
  const cacheKey = `${CACHE_KEY}_${startDate}_${endDate}_${scopeKey}`;
  const cached = serverCache.get<DashboardSummaryResponseDto>(cacheKey);
  if (cached) return cached;

  const allBoards = await boardsService.findAll();
  const allowed = allowedBoardIds === undefined ? undefined : new Set(allowedBoardIds);
  const boards = allBoards.filter(
    b => !b.isBugMonitoring && (allowed === undefined || allowed.has(b.boardId)),
  );

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
          memberSummaries: issues.map(toDashboardMemberSummary),
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
      const memberSummaries = issues.map(toDashboardMemberSummary);

      let epicCount = 0;
      const sprintId = report?.sprintId;
      if (sprintId) {
        try {
          const allMembers = await membersService.findAll();
          const teamMembers = filterReportMembersForProject(
            allMembers,
            board.shortName,
            report?.sprintStartDate,
            report?.sprintEndDate,
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
