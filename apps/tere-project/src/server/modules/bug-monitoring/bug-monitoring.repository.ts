import { jiraClient } from '@server/lib/jira.client';
import { JiraBugEntity, JiraBugSearchResponseDto } from '@shared/types/bug-monitoring.types';
import { boardsService } from '@server/modules/boards/boards.service';

const MAX_RESULTS = parseInt(process.env.JIRA_MAX_RESULTS ?? '100', 10);
const TIMEOUT = parseInt(process.env.JIRA_REQUEST_TIMEOUT ?? '30000', 10);
const MAX_RETRY = parseInt(process.env.JIRA_RETRY_ATTEMPTS ?? '3', 10);
const BASE_RETRY_DELAY = 1000;

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

    const issueTypeClause = board.bugIssueType ? ` AND issuetype = ${board.bugIssueType}` : '';
    const jql = `project = ${board.shortName}${issueTypeClause} ORDER BY created DESC`;
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
            fields: ['summary', 'status', 'priority', 'assignee', 'created', 'updated', 'resolution'].join(','),
          },
          timeout: TIMEOUT,
        }),
      );
      total = response.data.total;
      allBugs.push(...response.data.issues);
      startAt += MAX_RESULTS;
    } while (startAt < total);

    return allBugs;
  }
}
