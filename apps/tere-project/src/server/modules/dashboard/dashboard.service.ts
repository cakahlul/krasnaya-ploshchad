import { canAccessBoard } from '@server/auth/access-policy';
import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { filterReportForMember } from '@server/modules/reports/report-filter';
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
  caller: CallerIdentity,
  requestedStartDate?: string,
  requestedEndDate?: string,
  allowedBoardIds?: readonly number[],
  sources = { generateOpenSprintReport, generateReportByDateRange, getSprintWorkItemStats },
): Promise<DashboardSummaryResponseDto> {
  if (!caller || (!caller.isLead && !caller.fullName)) throw new Error('Forbidden');
  const defaultRange = getKanbanDateRange();
  const startDate = requestedStartDate ?? defaultRange.startDate;
  const endDate = requestedEndDate ?? defaultRange.endDate;
  const scopeKey = allowedBoardIds === undefined
    ? 'all'
    : [...allowedBoardIds].sort((a, b) => a - b).join(',');
  const activeMembers = caller.isLead ? await membersService.findActiveTeamMembers(caller.teams ?? []) : [];
  const activeNames = new Set(activeMembers.map(member => member.fullName));
  const identityKey = JSON.stringify([caller.email, caller.isLead, caller.fullName, [...(caller.teams ?? [])].sort(), [...activeNames].sort()]);
  const cacheKey = `${CACHE_KEY}_v2_${startDate}_${endDate}_${scopeKey}_${identityKey}`;
  const cached = serverCache.get<DashboardSummaryResponseDto>(cacheKey);
  if (cached) return cached;

  const allBoards = await boardsService.findAll();
  const allowed = allowedBoardIds === undefined ? undefined : new Set(allowedBoardIds);
  const boards = allBoards.filter(
    b => !b.isBugMonitoring && canAccessBoard({ ...caller, isLead: false }, b) && (allowed === undefined || allowed.has(b.boardId)),
  );

  const teams = await Promise.all(
    boards.map(async (board) => {
      if (board.isKanban) {
        const boardRange = requestedStartDate && requestedEndDate
          ? { startDate, endDate }
          : getKanbanDateRange(undefined, board.kanbanCycleStartDate ?? undefined);
        const unfilteredReport = await sources.generateReportByDateRange(boardRange.startDate, boardRange.endDate, board.shortName).catch(() => null);
        const report = unfilteredReport ? filterReportForMember(unfilteredReport, caller) : null;
        const issues = (report?.issues ?? []).filter(issue => !caller.isLead || activeNames.has(issue.member));
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

      const [unfilteredReport, workItems] = await Promise.all([
        sources.generateOpenSprintReport(board.shortName).catch(() => null),
        !caller.isLead ? Promise.resolve(null) : sources.getSprintWorkItemStats(board.shortName).catch(() => ({ totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null })),
      ]);

      const report = unfilteredReport ? filterReportForMember(unfilteredReport, caller) : null;
      const issues = (report?.issues ?? []).filter(issue => !caller.isLead || activeNames.has(issue.member));
      const memberSummaries = issues.map(toDashboardMemberSummary);

      let epicCount = caller.isLead ? 0 : new Set(issues.flatMap(issue => issue.epicKeys?.filter(key => key !== 'null') ?? [])).size;
      const sprintId = report?.sprintId;
      if (sprintId && caller.isLead) {
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
        totalWorkItems: workItems?.totalWorkItems ?? issues.reduce((sum, issue) => sum + issue.issueKeys.length, 0),
        closedWorkItems: workItems?.closedWorkItems ?? issues.reduce((sum, issue) => sum + issue.issueKeys.length, 0),
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
