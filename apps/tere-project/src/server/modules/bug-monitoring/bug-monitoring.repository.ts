import { jiraClient } from '@server/lib/jira.client';
import { JiraBugEntity, JiraBugSearchResponseDto } from '@shared/types/bug-monitoring.types';
import { boardsService } from '@server/modules/boards/boards.service';
import { bugCloseOverride } from '@server/db/schema';
import { MemoryCache } from '@server/lib/cache';
import { db } from '@server/lib/db';

const MAX_RESULTS = parseInt(process.env.JIRA_MAX_RESULTS ?? '100', 10);
const TIMEOUT = parseInt(process.env.JIRA_REQUEST_TIMEOUT ?? '30000', 10);
const MAX_RETRY = parseInt(process.env.JIRA_RETRY_ATTEMPTS ?? '3', 10);
const BASE_RETRY_DELAY = 1000;

export function buildBugJql(board: { shortName: string; bugIssueType?: string; bugJql?: string }): string {
  if (board.bugJql?.trim()) return board.bugJql.trim();
  const issueTypeClause = board.bugIssueType ? ` AND issuetype = ${board.bugIssueType}` : '';
  return `project = ${board.shortName}${issueTypeClause} ORDER BY created DESC`;
}

export function buildBugSnapshotJql(
  board: { shortName: string; bugIssueType?: string; bugJql?: string },
  monthEnd: string,
): string {
  const nextMonthStart = nextMonthStartFor(monthEnd);
  const base = buildBugJql(board).replace(/\s+ORDER BY\s+[\s\S]*$/i, '');
  return `${base} AND created < "${nextMonthStart}" AND (resolutiondate >= "${nextMonthStart}" OR resolution IS EMPTY) ORDER BY created DESC`;
}

function nextMonthStartFor(monthEnd: string): string {
  const nextMonth = new Date(`${monthEnd}T00:00:00Z`);
  nextMonth.setUTCDate(nextMonth.getUTCDate() + 1);
  return nextMonth.toISOString().slice(0, 10);
}

export function countActiveBugsAtMonthEnd(
  bugs: readonly JiraBugEntity[],
  monthEnd: string,
): number {
  const nextMonthStart = nextMonthStartFor(monthEnd);
  return bugs.filter(bug =>
    bug.fields.created.slice(0, 10) < nextMonthStart
    && (!bug.fields.resolutiondate || bug.fields.resolutiondate.slice(0, 10) >= nextMonthStart),
  ).length;
}

/**
 * A bug closed late (or never) by its author reports a resolutiondate that isn't when the work
 * actually finished, which drags the productivity-summary bug-close chart. `bug_close_override`
 * holds the real date per key; it wins over Jira. No row = keep whatever Jira says (a bug with no
 * resolutiondate is still open and stays uncounted).
 *
 * The override lands as the bare `YYYY-MM-DD` the column stores — every consumer compares this
 * field by `slice(0, 7)` / `slice(0, 10)` against date strings, so no synthetic time-of-day is
 * needed and none is invented.
 */
export function applyCloseOverrides(
  bugs: readonly JiraBugEntity[],
  overrides: ReadonlyMap<string, string>,
): JiraBugEntity[] {
  return bugs.map(bug => {
    const closedDate = overrides.get(bug.key);
    if (!closedDate) return bug as JiraBugEntity;
    return { ...bug, fields: { ...bug.fields, resolutiondate: closedDate } };
  });
}

// Handful of manually-inserted rows read on every bug fetch. 5 minutes so a new override shows up
// without a restart; `invalidateCloseOverrides()` is there for whenever a write path lands.
const overrideCache = new MemoryCache(5 * 60 * 1000);

export function invalidateCloseOverrides(): void {
  overrideCache.invalidate('all');
}

async function loadCloseOverrides(): Promise<Map<string, string>> {
  const cached = overrideCache.get<Map<string, string>>('all');
  if (cached) return cached;
  const rows = await db.select().from(bugCloseOverride);
  const overrides = new Map(rows.map(row => [row.key, row.closedDate]));
  overrideCache.set('all', overrides);
  return overrides;
}

function isRetryable(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { status?: number }; code?: string };
    const status = e.response?.status;
    if (status === 401 || status === 403 || status === 400) return false;
    if (status === 429 || (status && status >= 500)) return true;
    const retryableCodes = ['ENOTFOUND', 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED'];
    if (typeof e.code === 'string' && retryableCodes.includes(e.code)) return true;
  }
  return false;
}

async function withRetry<T>(op: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRY) throw err;
      await new Promise((r) => setTimeout(r, BASE_RETRY_DELAY * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export class BugMonitoringRepository {
  async fetchBugsByBoard(boardId: number): Promise<JiraBugEntity[]> {
    const boards = await boardsService.findAll();
    const board = boards.find(b => b.boardId === boardId && b.isBugMonitoring);
    if (!board) throw new Error(`No bug monitoring board found for boardId ${boardId}`);

    return this.fetchBugs(board, buildBugJql(board));
  }

  async fetchActiveBugsByBoardAtMonthEnd(boardId: number, monthEnd: string): Promise<JiraBugEntity[]> {
    const boards = await boardsService.findAll();
    const board = boards.find(b => b.boardId === boardId && b.isBugMonitoring);
    if (!board) throw new Error(`No bug monitoring board found for boardId ${boardId}`);

    return this.fetchBugs(board, buildBugSnapshotJql(board, monthEnd));
  }

  private async fetchBugs(
    board: { shortName: string; bugIssueType?: string; bugJql?: string },
    jql: string,
  ): Promise<JiraBugEntity[]> {
    const searchUrl = '/rest/api/3/search/jql';
    const allBugs: JiraBugEntity[] = [];
    let startAt = 0;
    let total = 0;

    do {
      const response = await withRetry(() =>
        jiraClient.get<JiraBugSearchResponseDto>(searchUrl, {
          params: {
            jql,
            maxResults: MAX_RESULTS,
            startAt,
            fields: ['summary', 'status', 'priority', 'assignee', 'created', 'updated', 'resolution', 'resolutiondate'].join(','),
          },
          timeout: TIMEOUT,
        }),
      );
      total = response.data.total;
      allBugs.push(...response.data.issues);
      startAt += MAX_RESULTS;
    } while (startAt < total);

    return applyCloseOverrides(allBugs, await loadCloseOverrides());
  }
}
