import { Injectable, Logger } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import axios from 'axios';
import {
  JiraIssueDto,
  JiraSearchRequestDto,
  JiraSearchResponseDto,
} from '../interfaces/report.dto';

@Injectable()
export class ReportJiraRepository {
  private readonly logger = new Logger(ReportJiraRepository.name);
  private url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };

  // Configurable settings with validation
  private readonly searchEndpoint: string;
  private readonly maxResults: number;
  private readonly rateLimitMs: number;
  private readonly requestTimeout: number;
  private readonly maxRetryAttempts: number;
  private readonly baseRetryDelay = 1000; // 1 second base delay

  constructor() {
    // Load and validate configuration values
    this.searchEndpoint =
      process.env.JIRA_SEARCH_ENDPOINT ?? '/rest/api/3/search/jql';
    this.maxResults = this.validateNumber(
      process.env.JIRA_MAX_RESULTS,
      100,
      1,
      1000,
    );
    this.rateLimitMs = this.validateNumber(
      process.env.JIRA_RATE_LIMIT_MS,
      1000,
      100,
      30000,
    );
    this.requestTimeout = this.validateNumber(
      process.env.JIRA_REQUEST_TIMEOUT,
      30000,
      5000,
      120000,
    );
    this.maxRetryAttempts = this.validateNumber(
      process.env.JIRA_RETRY_ATTEMPTS,
      3,
      1,
      10,
    );
  }

  private validateNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    if (!value) return defaultValue;

    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < min) return defaultValue;
    if (parsed > max) return max;

    return parsed;
  }

  async fetchRawData(dto: JiraSearchRequestDto): Promise<JiraIssueEntity[]> {
    const jql = `
      project = ${dto.project}
      AND sprint = ${dto.sprint}
      AND assignee IN (${dto.assignees.join(',')})
      AND type IN standardIssueTypes()
      AND resolution = Done
      ORDER BY created DESC
    `
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `${this.url}${this.searchEndpoint}`;
    const allIssues: JiraIssueEntity[] = [];
    let nextPageToken: string | undefined = undefined;
    let isLast = false;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        const params: Record<string, unknown> = {
          jql,
          maxResults: this.maxResults,
          fields: [
            'summary',
            'customfield_10005', // Story Points
            'customfield_10796', // Story point type
            'customfield_10865', // Complexity (low/medium/high)
            'customfield_11015', // Weight of Complexity
            'customfield_11444', // Appendix weight point v2
            'customfield_11312', // Story point type v2
            'customfield_11543', // Appendix v3
            'assignee',
            'issuetype',
          ].join(','),
          validateQuery: 'strict', // Enable JQL validation
        };

        // Only include nextPageToken if it exists (not on first request)
        if (nextPageToken) {
          params['nextPageToken'] = nextPageToken;
        }

        const response = await this.executeWithRetry(() =>
          axios.get<JiraSearchResponseDto>(searchUrl, {
            auth: this.auth,
            params,
            timeout: this.requestTimeout,
          }),
        );
        isLast = Boolean(response.data.isLast);

        nextPageToken = response.data.nextPageToken;
        const pageIssues = this.transformIssues(response.data.issues);
        allIssues.push(...pageIssues);

        // Log successful API request
        this.logger.log('Jira API request successful', {
          page: pageCount,
          issues: pageIssues.length,
          hasNextPage: !isLast,
        });

        // Log pagination progress if there's a next page
        if (!isLast && nextPageToken) {
          this.logger.log('Pagination progress', {
            page: pageCount,
            hasNextPage: true,
            nextPageToken: this.sanitizeToken(nextPageToken),
          });
        }

        // If isLast is false but nextPageToken is missing, treat as final page to avoid infinite loop
        if (!isLast && !nextPageToken) {
          isLast = true;
        }

        // Respect rate limits (Jira's guideline: 1 request/second)
        if (!isLast) {
          this.logger.warn('Rate limit applied', {
            delay: this.rateLimitMs,
            page: pageCount,
          });
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
        }
      } while (!isLast);
      return allIssues;
    } catch (error) {
      // Log the error with sanitized details
      this.logger.error('Jira API error', {
        ...this.sanitizeErrorForLogging(error),
        context: 'fetchRawData',
      });
      console.error('Error fetching data from Jira:', error);
      throw new Error('Failed to fetch data from Jira');
    }
  }

  /**
   * Fetch raw data by date range instead of sprint
   * Uses resolutiondate to filter issues resolved within the date range
   */
  async fetchRawDataByDateRange(
    project: string,
    assignees: string[],
    startDate: string,
    endDate: string,
  ): Promise<JiraIssueEntity[]> {
    const jql = `
      project = ${project}
      AND assignee IN (${assignees.join(',')})
      AND type IN standardIssueTypes()
      AND resolution = Done
      AND resolutiondate >= "${startDate}"
      AND resolutiondate <= "${endDate}"
      ORDER BY created DESC
    `
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `${this.url}${this.searchEndpoint}`;
    const allIssues: JiraIssueEntity[] = [];
    let nextPageToken: string | undefined = undefined;
    let isLast = false;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        const params: Record<string, unknown> = {
          jql,
          maxResults: this.maxResults,
          fields: [
            'summary',
            'customfield_10005', // Story Points
            'customfield_10796', // Story point type
            'customfield_10865', // Complexity (low/medium/high)
            'customfield_11015', // Weight of Complexity
            'customfield_11444', // Appendix weight point v2
            'customfield_11312', // Story point type v2
            'customfield_11543', // Appendix v3
            'assignee',
            'issuetype',
          ].join(','),
          validateQuery: 'strict',
        };

        if (nextPageToken) {
          params['nextPageToken'] = nextPageToken;
        }

        const response = await this.executeWithRetry(() =>
          axios.get<JiraSearchResponseDto>(searchUrl, {
            auth: this.auth,
            params,
            timeout: this.requestTimeout,
          }),
        );
        isLast = Boolean(response.data.isLast);

        nextPageToken = response.data.nextPageToken;
        const pageIssues = this.transformIssues(response.data.issues);
        allIssues.push(...pageIssues);

        this.logger.log('Jira API (dateRange) request successful', {
          page: pageCount,
          issues: pageIssues.length,
          hasNextPage: !isLast,
          dateRange: `${startDate} to ${endDate}`,
        });

        if (!isLast && !nextPageToken) {
          isLast = true;
        }

        if (!isLast) {
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
        }
      } while (!isLast);
      return allIssues;
    } catch (error) {
      this.logger.error('Jira API error (dateRange)', {
        ...this.sanitizeErrorForLogging(error),
        context: 'fetchRawDataByDateRange',
      });
      console.error('Error fetching date range data from Jira:', error);
      throw new Error('Failed to fetch date range data from Jira');
    }
  }

  /**
   * Fetch issues from the currently open/active sprint using openSprints() JQL
   * This is used for dashboard summary to avoid sprint name quoting issues
   */
  async fetchOpenSprintData(
    project: string,
    assignees: string[],
  ): Promise<JiraIssueEntity[]> {
    const jql = `
      project = ${project}
      AND sprint in openSprints()
      AND assignee IN (${assignees.join(',')})
      AND type IN standardIssueTypes()
      AND resolution = Done
      ORDER BY created DESC
    `
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `${this.url}${this.searchEndpoint}`;
    const allIssues: JiraIssueEntity[] = [];
    let nextPageToken: string | undefined = undefined;
    let isLast = false;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        const params: Record<string, unknown> = {
          jql,
          maxResults: this.maxResults,
          fields: [
            'summary',
            'customfield_10005',
            'customfield_10796',
            'customfield_10865',
            'customfield_11015',
            'customfield_11444',
            'customfield_11312',
            'customfield_11543',
            'assignee',
            'issuetype',
          ].join(','),
          validateQuery: 'strict',
        };

        if (nextPageToken) {
          params['nextPageToken'] = nextPageToken;
        }

        const response = await this.executeWithRetry(() =>
          axios.get<JiraSearchResponseDto>(searchUrl, {
            auth: this.auth,
            params,
            timeout: this.requestTimeout,
          }),
        );
        isLast = Boolean(response.data.isLast);

        nextPageToken = response.data.nextPageToken;
        const pageIssues = this.transformIssues(response.data.issues);
        allIssues.push(...pageIssues);

        this.logger.log('Jira API (openSprints) request successful', {
          page: pageCount,
          issues: pageIssues.length,
          hasNextPage: !isLast,
        });

        if (!isLast && !nextPageToken) {
          isLast = true;
        }

        if (!isLast) {
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
        }
      } while (!isLast);
      return allIssues;
    } catch (error) {
      this.logger.error('Jira API error (openSprints)', {
        ...this.sanitizeErrorForLogging(error),
        context: 'fetchOpenSprintData',
      });
      console.error('Error fetching open sprint data from Jira:', error);
      throw new Error('Failed to fetch open sprint data from Jira');
    }
  }

  /**
   * Fetch ALL issues from the currently open/active sprint (both open and closed)
   * Used for calculating work item statistics (total vs closed, avg time to close)
   */
  async fetchAllSprintIssues(project: string): Promise<JiraIssueEntity[]> {
    const jql = `
      project = ${project}
      AND sprint in openSprints()
      AND type IN standardIssueTypes()
      ORDER BY created DESC
    `
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `${this.url}${this.searchEndpoint}`;
    const allIssues: JiraIssueEntity[] = [];
    let nextPageToken: string | undefined = undefined;
    let isLast = false;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        const params: Record<string, unknown> = {
          jql,
          maxResults: this.maxResults,
          fields: [
            'summary',
            'created',
            'resolutiondate',
            'resolution',
            'assignee',
            'issuetype',
          ].join(','),
          validateQuery: 'strict',
        };

        if (nextPageToken) {
          params['nextPageToken'] = nextPageToken;
        }

        const response = await this.executeWithRetry(() =>
          axios.get<JiraSearchResponseDto>(searchUrl, {
            auth: this.auth,
            params,
            timeout: this.requestTimeout,
          }),
        );
        isLast = Boolean(response.data.isLast);

        nextPageToken = response.data.nextPageToken;
        const pageIssues = this.transformIssues(response.data.issues);
        allIssues.push(...pageIssues);

        this.logger.log('Jira API (allSprintIssues) request successful', {
          page: pageCount,
          issues: pageIssues.length,
          hasNextPage: !isLast,
        });

        if (!isLast && !nextPageToken) {
          isLast = true;
        }

        if (!isLast) {
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
        }
      } while (!isLast);
      return allIssues;
    } catch (error) {
      this.logger.error('Jira API error (allSprintIssues)', {
        ...this.sanitizeErrorForLogging(error),
        context: 'fetchAllSprintIssues',
      });
      console.error('Error fetching all sprint issues from Jira:', error);
      throw new Error('Failed to fetch all sprint issues from Jira');
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error should be retried
        if (
          !this.isRetryableError(error) ||
          attempt === this.maxRetryAttempts
        ) {
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = this.baseRetryDelay * Math.pow(2, attempt);

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    // Handle axios errors
    if (this.isAxiosError(error)) {
      const status = error.response?.status;

      // Non-retryable HTTP status codes
      if (status === 401 || status === 403 || status === 400) {
        return false;
      }

      // Retryable HTTP status codes
      if (status === 429) {
        return true; // Rate limit
      }

      if (status && status >= 500) {
        return true; // Server errors
      }
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    return false;
  }

  private isAxiosError(error: unknown): error is {
    response?: { status: number };
    code?: string;
    isAxiosError?: boolean;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('response' in error || 'code' in error)
    );
  }

  private isNetworkError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      return [
        'ENOTFOUND',
        'ECONNRESET',
        'ECONNABORTED',
        'ETIMEDOUT',
        'ECONNREFUSED',
      ].includes(code);
    }
    return false;
  }

  private transformIssues(issues: JiraIssueDto[]): JiraIssueEntity[] {
    return issues.map((issue: JiraIssueDto) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      fields: issue.fields,
    }));
  }

  private sanitizeToken(token?: string): string {
    return token ? '***TOKEN***' : '';
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Keep the domain and path, remove query parameters that might contain tokens
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return '***URL***';
    }
  }

  private sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object'
    ) {
      if ('status' in error.response) {
        sanitized.status = error.response.status;
      }
      if ('statusText' in error.response) {
        sanitized.error = error.response.statusText;
      }
    }

    if (
      error &&
      typeof error === 'object' &&
      'config' in error &&
      error.config &&
      typeof error.config === 'object' &&
      'url' in error.config &&
      typeof error.config.url === 'string'
    ) {
      sanitized.url = this.sanitizeUrl(error.config.url);
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      sanitized.code = error.code;
    }

    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      sanitized.message = error.message;
    }

    return sanitized;
  }
}
