import { and, desc, eq } from 'drizzle-orm';
import { productivityArchiveCoverage, productivityArchiveDeveloperSprint } from '@server/db/schema';
import { db } from '@server/lib/db';
import { boardsService } from '@server/modules/boards/boards.service';
import { BugMonitoringRepository } from '@server/modules/bug-monitoring/bug-monitoring.repository';
import { routeProductivityMonth, type ArchiveDeveloperSprint, type ProductivityArchiveRepository } from '@server/modules/productivity-archive/productivity-archive';
import { reportingGroupService } from '@server/modules/reporting-groups/reporting-group.service';
import { membersService } from '@server/modules/members/members.service';
import type { BoardResponse } from '@shared/types/board.types';
import type { JiraBugEntity } from '@shared/types/bug-monitoring.types';
import type { MemberResponse } from '@shared/types/member.types';
import { generateProductivitySummaryBoard, type ProductivitySummaryMemberDto } from './productivity-summary.service';
import type { MonthSourceResult, RangeAggregationPorts, ReportingGroup, RuleVersion, SourceMember } from './productivity-summary-range.service';

const archiveRepository: ProductivityArchiveRepository = {
  async getWatermark() {
    const [row] = await db.select({ month: productivityArchiveCoverage.archivedMonth })
      .from(productivityArchiveCoverage).orderBy(desc(productivityArchiveCoverage.archivedMonth)).limit(1);
    return row?.month ?? null;
  },
  async findCoverage(month) {
    const [row] = await db.select().from(productivityArchiveCoverage)
      .where(eq(productivityArchiveCoverage.archivedMonth, month)).limit(1);
    return row ? { archivedMonth: row.archivedMonth, importBatchId: row.importBatchId, rowCount: row.rowCount } : null;
  },
  async findRows(month, importBatchId) {
    const rows = await db.select().from(productivityArchiveDeveloperSprint).where(and(
      eq(productivityArchiveDeveloperSprint.archivedMonth, month),
      eq(productivityArchiveDeveloperSprint.importBatchId, importBatchId),
    ));
    return rows.map(row => ({
      archivedMonth: row.archivedMonth,
      importBatchId: row.importBatchId,
      sprintId: row.sprintId,
      sprintStartDate: row.sprintStartDate,
      sprintEndDate: row.sprintEndDate,
      boardIdSnapshot: row.boardIdSnapshot,
      boardNameSnapshot: row.boardNameSnapshot,
      reportingGroupSnapshot: row.reportingGroupSnapshot as ArchiveDeveloperSprint['reportingGroupSnapshot'],
      developerIdentityNormalized: row.developerIdentityNormalized,
      developerNameSnapshot: String((row.normalizedRecord as { developerNameSnapshot?: unknown }).developerNameSnapshot ?? row.developerIdentityNormalized),
      sourceStatus: row.sourceStatus,
      spTotal: row.spTotal === null ? null : Number(row.spTotal),
      spTarget: row.spTarget === null ? null : Number(row.spTarget),
      workingDays: row.workingDays === null ? null : Number(row.workingDays),
    }));
  },
};

interface Dependencies {
  findBoards(): Promise<BoardResponse[]>;
  findMembers(): Promise<MemberResponse[]>;
  loadBoard(month: number, year: number, team: string): Promise<ProductivitySummaryMemberDto[]>;
  routeMonth(month: string): ReturnType<typeof routeProductivityMonth>;
  fetchBugs(boardId: number): Promise<JiraBugEntity[]>;
  fetchActiveBugs?(boardId: number, monthEnd: string): Promise<JiraBugEntity[]>;
  resolveRule(group: ReportingGroup, month: string): Promise<{ ruleVersion: RuleVersion }>;
}

function archiveMembers(rows: readonly ArchiveDeveloperSprint[], groups: readonly ReportingGroup[], roster: readonly MemberResponse[], month: string) {
  const members = new Map<string, SourceMember>();
  const lifecycle = new Map(roster.map(member => [member.email.trim().toLowerCase(), member]));
  const ambiguous = new Set<string>();
  const failures: NonNullable<MonthSourceResult['failures']> = [];
  for (const row of rows) {
    const memberLifecycle = lifecycle.get(row.developerIdentityNormalized);
    if (!memberLifecycle) {
      failures.push({ scope: 'productivity', reason: `MEMBER_LIFECYCLE_UNRESOLVED:${row.developerIdentityNormalized}` });
      continue;
    }
    if (memberLifecycle.joinDate > `${month}-31` || (memberLifecycle.resignDate && memberLifecycle.resignDate < `${month}-01`)) continue;
    const group = row.reportingGroupSnapshot ?? 'Ungrouped';
    if (!groups.includes(group)) continue;
    if (ambiguous.has(row.developerIdentityNormalized)) continue;
    const board = row.boardNameSnapshot ?? String(row.boardIdSnapshot ?? 'Archived');
    const existing = members.get(row.developerIdentityNormalized);
    if (existing && existing.group !== group) {
      members.delete(row.developerIdentityNormalized);
      ambiguous.add(row.developerIdentityNormalized);
      failures.push({ scope: 'productivity', reason: 'MULTIPLE_REPORTING_GROUPS' });
      continue;
    }
    const member = existing ?? {
      id: row.developerIdentityNormalized,
      name: row.developerNameSnapshot,
      group,
      board,
      boards: [],
      spTotal: 0,
      spTarget: 0,
      wpTotal: null,
      workingDays: null,
    };
    if (!member.boards!.includes(board)) member.boards!.push(board);
    member.spTotal! += row.spTotal ?? 0;
    member.spTarget = member.spTarget === null || row.spTarget === null || row.spTarget === undefined
      ? member.spTarget ?? row.spTarget ?? null
      : (member.spTarget ?? 0) + row.spTarget;
    const workingDays = row.workingDays ?? null;
    member.workingDays = member.workingDays === null || workingDays === null
      ? member.workingDays ?? workingDays
      : member.workingDays + workingDays;
    members.set(row.developerIdentityNormalized, member);
  }
  return { members: [...members.values()], failures };
}

export function createProductivitySummaryRangePorts(deps: Dependencies): RangeAggregationPorts {
  return {
    async loadMonth(month, groups): Promise<MonthSourceResult> {
      const routed = await deps.routeMonth(month);
      if (routed.source !== 'live') {
        const roster = await deps.findMembers();
        const archived = routed.rows ? archiveMembers(routed.rows, groups, roster, month) : { members: [], failures: [] };
        const failures = [
          ...(routed.failure ? [{ scope: 'productivity' as const, reason: routed.failure.reason }] : []),
          ...archived.failures,
        ];
        return {
          source: routed.source,
          archiveBacked: true,
          availability: { productivity: routed.rows !== null },
          members: archived.members,
          appliedRules: [],
          failures,
        };
      }

      const [boards, roster, appliedRules] = await Promise.all([
        deps.findBoards(),
        deps.findMembers(),
        Promise.all(groups.map(async group => ({ group, ...(await deps.resolveRule(group, month)) }))),
      ]);
      const selectedBoards = boards.filter(board => !board.isBugMonitoring && groups.includes(board.reportingGroup ?? 'Ungrouped'));
      const loaded = await Promise.allSettled(selectedBoards.map(board =>
        deps.loadBoard(Number(month.slice(5, 7)), Number(month.slice(0, 4)), board.shortName),
      ));
      const boardGroups = new Map(selectedBoards.map(board => [board.shortName, board.reportingGroup ?? 'Ungrouped'] as const));
      const identities = new Map(roster.map(member => [member.fullName.trim().toLowerCase(), member.email.trim().toLowerCase()]));
      const failures = loaded.flatMap((result, index) => result.status === 'rejected'
        ? [{ scope: 'productivity' as const, group: boardGroups.get(selectedBoards[index].shortName), board: selectedBoards[index].shortName, reason: result.reason instanceof Error ? result.reason.message : 'Unknown board failure' }]
        : []);
      const members = new Map<string, SourceMember>();
      const ambiguous = new Set<string>();
      loaded.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const board = selectedBoards[index].shortName;
        for (const item of result.value) {
          const id = identities.get(item.name.trim().toLowerCase());
          if (!id) {
            failures.push({ scope: 'productivity', group: boardGroups.get(board), board, reason: `MEMBER_IDENTITY_UNRESOLVED:${item.name}` });
            continue;
          }
          if (ambiguous.has(id)) continue;
          const current = members.get(id);
          const group = boardGroups.get(board) ?? 'Ungrouped';
          if (current && current.group !== group) {
            members.delete(id);
            ambiguous.add(id);
            failures.push({ scope: 'productivity', group: undefined, board, reason: 'MULTIPLE_REPORTING_GROUPS' });
            continue;
          }
          const existing = current ?? {
            id, name: item.name, group, board,
            boards: [], spTotal: 0, wpTotal: 0, spTarget: 0, workingDays: 0,
          };
          if (!existing.boards!.includes(board)) existing.boards!.push(board);
          existing.spTotal! += item.spTotal;
          existing.wpTotal! += item.wpTotal;
          existing.spTarget! += item.workingDays * 8;
          existing.workingDays = Math.max(existing.workingDays ?? 0, item.workingDays);
          members.set(id, existing);
        }
      });
      const fulfilledCount = loaded.filter(result => result.status === 'fulfilled').length;
      return {
        source: failures.length ? 'partial' : 'live',
        availability: { productivity: selectedBoards.length === 0 || fulfilledCount > 0 },
        appliedRules,
        members: [...members.values()],
        failures,
      };
    },
    async loadBugCount(month, group) {
      const boards = (await deps.findBoards()).filter(board => board.isBugMonitoring && (board.reportingGroup ?? 'Ungrouped') === group);
      const monthEnd = new Date(`${month}-01T00:00:00Z`);
      monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
      const bugs = await Promise.all(boards.map(board => deps.fetchActiveBugs
        ? deps.fetchActiveBugs(board.boardId, monthEnd.toISOString().slice(0, 10))
        : deps.fetchBugs(board.boardId)));
      return bugs.flat().length;
    },
    async loadBugRaisedCount(month, group) {
      const boards = (await deps.findBoards()).filter(board => board.isBugMonitoring && (board.reportingGroup ?? 'Ungrouped') === group);
      const bugs = await Promise.all(boards.map(board => deps.fetchBugs(board.boardId)));
      return bugs.flat().filter(bug => bug.fields.created.slice(0, 7) === month).length;
    },
    async loadBugDoneCount(month, group) {
      const boards = (await deps.findBoards()).filter(board => board.isBugMonitoring && (board.reportingGroup ?? 'Ungrouped') === group);
      const bugs = await Promise.all(boards.map(board => deps.fetchBugs(board.boardId)));
      return bugs.flat().filter(bug => bug.fields.resolutiondate?.slice(0, 7) === month).length;
    },
  };
}

const bugRepository = new BugMonitoringRepository();
export const productivitySummaryRangePorts = createProductivitySummaryRangePorts({
  findBoards: () => boardsService.findAll(),
  findMembers: () => membersService.findAll(),
  loadBoard: generateProductivitySummaryBoard,
  routeMonth: month => routeProductivityMonth(`${month}-01`, archiveRepository),
  fetchBugs: boardId => bugRepository.fetchBugsByBoard(boardId),
  fetchActiveBugs: (boardId, monthEnd) => bugRepository.fetchActiveBugsByBoardAtMonthEnd(boardId, monthEnd),
  resolveRule: (group, month) => reportingGroupService.resolveRule(group, month),
});
