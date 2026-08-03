import { and, desc, eq } from 'drizzle-orm';
import { productivityArchiveCoverage, productivityArchiveDeveloperSprint } from '@server/db/schema';
import { db } from '@server/lib/db';
import { MemoryCache } from '@server/lib/cache';
import { boardsService } from '@server/modules/boards/boards.service';
import { BugMonitoringRepository } from '@server/modules/bug-monitoring/bug-monitoring.repository';
import { routeProductivityMonth, type ArchiveDeveloperSprint, type ProductivityArchiveRepository } from '@server/modules/productivity-archive/productivity-archive';
import { reportingGroupService } from '@server/modules/reporting-groups/reporting-group.service';
import { membersService } from '@server/modules/members/members.service';
import type { BoardResponse } from '@shared/types/board.types';
import type { JiraBugEntity } from '@shared/types/bug-monitoring.types';
import type { MemberResponse } from '@shared/types/member.types';
import { generateProductivitySummaryBoard, type ProductivitySummaryMemberDto } from './productivity-summary.service';
import { SP_PER_WORKING_DAY } from './productivity-summary-range.service';
import type { MonthSourceResult, RangeAggregationPorts, ReportingGroup, RuleVersion, SourceMember } from './productivity-summary-range.service';

export function createSingleFlight<K, V>(run: (key: K) => Promise<V>) {
  const inFlight = new Map<K, Promise<V>>();
  return (key: K): Promise<V> => {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const pending = run(key).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    return pending;
  };
}

// Every month in a range asks for its own coverage row and the watermark, so a 19-month request
// issued 19+ single-row reads of a table that holds one row per archived month. Read it whole once
// and answer both from that snapshot. Shared only while in flight, so an import is never masked.
const loadCoverageSnapshot = createSingleFlight(async (_: 'all') =>
  db.select().from(productivityArchiveCoverage).orderBy(desc(productivityArchiveCoverage.archivedMonth)),
);

const archiveRepository: ProductivityArchiveRepository = {
  async getWatermark() {
    const [row] = await loadCoverageSnapshot('all');
    return row?.archivedMonth ?? null;
  },
  async findCoverage(month) {
    const row = (await loadCoverageSnapshot('all')).find(item => item.archivedMonth === month);
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
      // Seeded null, not zero: a source that supplied no target must report "unknown", the same
      // way workingDays and wpTotal do. Zero would read as a real target of nothing.
      spTarget: null,
      wpTotal: null,
      workingDays: null,
    };
    if (!member.boards!.includes(board)) member.boards!.push(board);
    member.spTotal! += row.spTotal ?? 0;
    member.spTarget = member.spTarget === null || row.spTarget === null || row.spTarget === undefined
      ? member.spTarget ?? row.spTarget ?? null
      : (member.spTarget ?? 0) + row.spTarget;
    // Green-2025 rows carry no day_of_work column, but they do carry an SP target, and the whole
    // codebase defines that target as working days x SP_PER_WORKING_DAY. Inverting it recovers the
    // real figure instead of showing N/A; a row with neither still reports nothing.
    const workingDays = row.workingDays
      ?? (row.spTarget === null || row.spTarget === undefined ? null : row.spTarget / SP_PER_WORKING_DAY);
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
      const loaded = await Promise.allSettled(selectedBoards.map(async board => {
        const start = Date.now();
        try {
          return await deps.loadBoard(Number(month.slice(5, 7)), Number(month.slice(0, 4)), board.shortName);
        } finally {
          console.log(`[telemetry] productivity-summary-range load-board durationMs=${Date.now() - start} month=${month} board=${board.shortName}`);
        }
      }));
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
          // Boards report the same calendar month, so a member on two of them has one set of
          // working days, not two — hence max rather than a sum. Deriving the target from that
          // final figure keeps the two from disagreeing; summing it per board inflated capacity by
          // the number of boards a member touched and understated their productivity.
          existing.workingDays = Math.max(existing.workingDays ?? 0, item.workingDays);
          existing.spTarget = existing.workingDays * SP_PER_WORKING_DAY;
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
    async loadBugRaisedCount(month, group) {
      const start = Date.now();
      const boards = (await deps.findBoards()).filter(board => board.isBugMonitoring && (board.reportingGroup ?? 'Ungrouped') === group);
      const bugs = await Promise.all(boards.map(board => deps.fetchBugs(board.boardId)));
      console.log(`[telemetry] productivity-summary-range bug-board-call fn=loadBugRaisedCount durationMs=${Date.now() - start} month=${month} group=${group} boardCount=${boards.length}`);
      return bugs.flat().filter(bug => bug.fields.created.slice(0, 7) === month).length;
    },
    async loadBugDoneCount(month, group) {
      const start = Date.now();
      const boards = (await deps.findBoards()).filter(board => board.isBugMonitoring && (board.reportingGroup ?? 'Ungrouped') === group);
      const bugs = await Promise.all(boards.map(board => deps.fetchBugs(board.boardId)));
      console.log(`[telemetry] productivity-summary-range bug-board-call fn=loadBugDoneCount durationMs=${Date.now() - start} month=${month} group=${group} boardCount=${boards.length}`);
      return bugs.flat().filter(bug => bug.fields.resolutiondate?.slice(0, 7) === month).length;
    },
  };
}

const bugRepository = new BugMonitoringRepository();

/**
 * Stale-while-revalidate: a cache hit returns immediately, and past `staleAfterMs` also kicks off
 * a background refetch (single-flighted, errors swallowed) that patches the cache for whoever asks
 * next. Nobody waits on Jira unless the key has never been fetched before or has gone a full
 * `ttlMs` without anyone asking for it at all.
 */
function createStaleWhileRevalidate<T>(ttlMs: number, staleAfterMs: number, fetcher: (key: string) => Promise<T>) {
  const cache = new MemoryCache(ttlMs);
  const refresh = createSingleFlight(async (key: string) => {
    const data = await fetcher(key);
    cache.set(key, { data, fetchedAt: Date.now() });
    return data;
  });
  return async (key: string): Promise<T> => {
    const cached = cache.get<{ data: T; fetchedAt: number }>(key);
    if (!cached) return refresh(key);
    if (Date.now() - cached.fetchedAt > staleAfterMs) {
      refresh(key).catch(error => console.log(`[telemetry] productivity-summary-range background-refresh-failed key=${key} reason=${error instanceof Error ? error.message : 'unknown'}`));
    }
    return cached.data;
  };
}

// A range request asks every month for the same unfiltered board bug history, then filters it
// per month in memory. Cached for an hour, revalidated in the background every 30 minutes so a
// user always gets an instant answer while the count still catches up to Jira soon after.
const fetchBugsSWR = createStaleWhileRevalidate<JiraBugEntity[]>(
  60 * 60 * 1000,
  30 * 60 * 1000,
  boardId => bugRepository.fetchBugsByBoard(Number(boardId)),
);
const fetchBugsOnce = (boardId: number) => fetchBugsSWR(String(boardId));

// Same story for live-month board data: the sprint report behind a given (board, month) doesn't
// change once the month is over, and even the current month is fine served slightly stale while
// a background refresh catches it up.
const loadBoardSWR = createStaleWhileRevalidate<ProductivitySummaryMemberDto[]>(
  60 * 60 * 1000,
  30 * 60 * 1000,
  key => {
    const [year, month, shortName] = key.split(':');
    return generateProductivitySummaryBoard(Number(month), Number(year), shortName);
  },
);

export const productivitySummaryRangePorts = createProductivitySummaryRangePorts({
  findBoards: () => boardsService.findAll(),
  findMembers: () => membersService.findAll(),
  loadBoard: (month, year, shortName) => loadBoardSWR(`${year}:${month}:${shortName}`),
  routeMonth: month => routeProductivityMonth(`${month}-01`, archiveRepository),
  fetchBugs: fetchBugsOnce,
  resolveRule: (group, month) => reportingGroupService.resolveRule(group, month),
});
