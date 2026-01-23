import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  JiraBugEntity,
  JiraBugSearchResponseDto,
} from '../interfaces/bug-monitoring.entity';

@Injectable()
export class BugMonitoringRepository {
  private readonly logger = new Logger(BugMonitoringRepository.name);
  private readonly url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };

  // Configurable settings
  private readonly maxResults: number;
  private readonly rateLimitMs: number;
  private readonly requestTimeout: number;
  private readonly maxRetryAttempts: number;
  private readonly baseRetryDelay = 1000;

  constructor() {
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

  async fetchBugsByBoard(boardId: number): Promise<JiraBugEntity[]> {
    // Fetch ALL BugProduction bugs (all statuses)
    // Statistics will use all bugs, table will filter client-side
    const jql = `project = BUZZ AND issuetype = BugProduction ORDER BY created DESC`;
    const searchUrl = `${this.url}/rest/agile/1.0/board/${boardId}/issue`;
    const allBugs: JiraBugEntity[] = [];
    let startAt = 0;
    let total = 0;

    try {
      do {
        const params = {
          jql,
          maxResults: this.maxResults,
          startAt,
          fields: [
            'summary',
            'status',
            'priority',
            'assignee',
            'created',
            'updated',
            'resolution',
          ].join(','),
        };

        const response = await this.executeWithRetry(() =>
          axios.get<JiraBugSearchResponseDto>(searchUrl, {
            auth: this.auth,
            params,
            timeout: this.requestTimeout,
          }),
        );

        const bugs = response.data.issues;
        total = response.data.total;
        allBugs.push(...bugs);

        startAt += this.maxResults;

        // Respect rate limits
        if (startAt < total) {
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
        }
      } while (startAt < total);

      return allBugs;
    } catch (error) {
      this.logger.error('Jira Bug API error', {
        ...this.sanitizeErrorForLogging(error),
        context: 'fetchBugsByBoard',
      });
      console.error('Error fetching bugs from Jira:', error);
      throw new Error('Failed to fetch bugs from Jira');
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (
          !this.isRetryableError(error) ||
          attempt === this.maxRetryAttempts
        ) {
          throw error;
        }

        const delay = this.baseRetryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401 || status === 403 || status === 400) {
        return false;
      }

      if (status === 429 || (status && status >= 500)) {
        return true;
      }
    }

    if (this.isNetworkError(error)) {
      return true;
    }

    return false;
  }

  private isAxiosError(error: unknown): error is {
    response?: { status: number };
    code?: string;
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
      'message' in error &&
      typeof error.message === 'string'
    ) {
      sanitized.message = error.message;
    }

    return sanitized;
  }
}
