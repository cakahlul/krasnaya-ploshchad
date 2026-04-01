import { jiraClient } from '@server/lib/jira.client';
import type {
  JiraIssueEntity,
  JiraIssueDto,
  JiraSearchRequestDto,
  JiraSearchResponseDto,
} from '@shared/types/report.types';

const SEARCH_ENDPOINT = '/rest/api/3/search/jql';
const MAX_RESULTS = parseInt(process.env.JIRA_MAX_RESULTS ?? '100', 10);
const RATE_LIMIT_MS = parseInt(process.env.JIRA_RATE_LIMIT_MS ?? '1000', 10);
const REQUEST_TIMEOUT = parseInt(process.env.JIRA_REQUEST_TIMEOUT ?? '30000', 10);
const MAX_RETRY_ATTEMPTS = parseInt(process.env.JIRA_RETRY_ATTEMPTS ?? '3', 10);
const BASE_RETRY_DELAY = 1000;

const REPORT_FIELDS = [
  'summary', 'customfield_10005', 'customfield_10796', 'customfield_10865',
  'customfield_11015', 'customfield_11444', 'customfield_11312', 'customfield_11543',
  'assignee', 'issuetype', 'parent',
].join(',');

async function executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try { return await operation(); } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === MAX_RETRY_ATTEMPTS) throw error;
      await new Promise((r) => setTimeout(r, BASE_RETRY_DELAY * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as any).response?.status;
    if (status === 401 || status === 403 || status === 400) return false;
    if (status === 429 || (status && status >= 500)) return true;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return ['ENOTFOUND','ECONNRESET','ECONNABORTED','ETIMEDOUT','ECONNREFUSED'].includes((error as any).code);
  }
  return false;
}

function transformIssues(issues: JiraIssueDto[]): JiraIssueEntity[] {
  return issues.map((issue) => ({ id: issue.id, key: issue.key, summary: issue.fields.summary, fields: issue.fields }));
}

async function paginate(jql: string, fields: string): Promise<JiraIssueEntity[]> {
  const allIssues: JiraIssueEntity[] = [];
  let nextPageToken: string | undefined;
  let isLast = false;
  do {
    const params: Record<string, unknown> = { jql, maxResults: MAX_RESULTS, fields, validateQuery: 'strict' };
    if (nextPageToken) params['nextPageToken'] = nextPageToken;
    const response = await executeWithRetry(() => jiraClient.get<JiraSearchResponseDto>(SEARCH_ENDPOINT, { params, timeout: REQUEST_TIMEOUT }));
    isLast = Boolean(response.data.isLast);
    nextPageToken = response.data.nextPageToken;
    allIssues.push(...transformIssues(response.data.issues));
    if (!isLast && !nextPageToken) isLast = true;
    if (!isLast) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  } while (!isLast);
  return allIssues;
}

function buildProjectFilter(project: string): string {
  const projects = project.split(',').map(p => p.trim()).filter(Boolean);
  return projects.length === 1 ? `project = ${projects[0]}` : `project in (${projects.join(',')})`;
}

export async function fetchRawData(dto: JiraSearchRequestDto): Promise<JiraIssueEntity[]> {
  if (dto.assignees.length === 0) return [];
  const sprintIds = dto.sprint.split(',').map(s => s.trim()).filter(Boolean);
  const sprintFilter = sprintIds.length === 1
    ? `sprint = ${sprintIds[0]}`
    : `sprint in (${sprintIds.join(',')})`;
  const jql = `${buildProjectFilter(dto.project)} AND ${sprintFilter} AND assignee IN (${dto.assignees.join(',')}) AND type IN standardIssueTypes() AND resolution = Done ORDER BY created DESC`.replace(/\s+/g, ' ').trim();
  return paginate(jql, REPORT_FIELDS);
}

export async function fetchRawDataByDateRange(project: string, assignees: string[], startDate: string, endDate: string): Promise<JiraIssueEntity[]> {
  if (assignees.length === 0) return [];
  const jql = `${buildProjectFilter(project)} AND assignee IN (${assignees.join(',')}) AND type IN standardIssueTypes() AND resolution = Done AND resolutiondate >= "${startDate}" AND resolutiondate <= "${endDate}" ORDER BY created DESC`.replace(/\s+/g, ' ').trim();
  return paginate(jql, REPORT_FIELDS);
}

export async function fetchOpenSprintData(project: string, assignees: string[], sprintId?: number): Promise<JiraIssueEntity[]> {
  if (assignees.length === 0) return [];
  const sprintFilter = sprintId ? `sprint = ${sprintId}` : 'sprint in openSprints()';
  const jql = `project = ${project} AND ${sprintFilter} AND assignee IN (${assignees.join(',')}) AND type IN standardIssueTypes() AND resolution = Done ORDER BY created DESC`.replace(/\s+/g, ' ').trim();
  return paginate(jql, REPORT_FIELDS);
}

