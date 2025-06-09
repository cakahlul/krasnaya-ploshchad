import { Injectable, Logger } from '@nestjs/common';
import { ProjectEntity, SprintEntity } from '../interfaces/project.entity';
import axios, { AxiosError } from 'axios';

@Injectable()
export class ProjectRepository {
  private readonly logger = new Logger(ProjectRepository.name);
  private readonly url = process.env.JIRA_URL ?? '';
  private readonly limitFetch = process.env.LIMIT_SPRINT_FETCH ?? 50;
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };
  private readonly axiosInstance = axios.create({
    timeout: 5000, // 5 second timeout
    auth: this.auth,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  private async retryRequest<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    const startTime = Date.now();
    try {
      this.logger.log(`[${startTime}] Starting request...`);
      const result = await fn();
      const endTime = Date.now();
      this.logger.log(
        `[${endTime}] Request completed in ${endTime - startTime}ms`,
      );
      return result;
    } catch (error) {
      const endTime = Date.now();
      if (
        retries > 0 &&
        error instanceof AxiosError &&
        error.code === 'ECONNABORTED'
      ) {
        this.logger.warn(
          `[${endTime}] Request timed out after ${endTime - startTime}ms, retrying... (${retries} attempts left)`,
        );
        return this.retryRequest(fn, retries - 1);
      }
      this.logger.error(
        `[${endTime}] Request failed after ${endTime - startTime}ms:`,
        error,
      );
      throw error;
    }
  }

  async fetchJiraSprint(boardId: number): Promise<SprintEntity> {
    return this.retryRequest(async () => {
      try {
        let startAt = this.limitFetch;
        if (boardId == 143) {
          startAt = 32;
        }

        const url = `${this.url}/rest/agile/1.0/board/${boardId}/sprint?maxResults=25&startAt=${startAt}`;
        this.logger.log(`[${Date.now()}] Fetching sprints from Jira: ${url}`);

        const response = await this.axiosInstance.get<SprintEntity>(url);
        this.logger.log(
          `[${Date.now()}] Received ${response.data.values?.length ?? 0} sprints from Jira`,
        );
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          this.logger.error(
            `[${Date.now()}] Jira API error: ${error.message}`,
            {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout,
              },
            },
          );
          throw new Error(`Failed to fetch sprints: ${error.message}`);
        }
        throw error;
      }
    });
  }

  async fetchJiraProject(): Promise<ProjectEntity[]> {
    return this.retryRequest(async () => {
      try {
        const url = `${this.url}/rest/api/2/project`;
        this.logger.log(`[${Date.now()}] Fetching projects from Jira: ${url}`);

        const response = await this.axiosInstance.get<ProjectEntity[]>(url);
        this.logger.log(
          `[${Date.now()}] Received ${response.data.length} projects from Jira`,
        );
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          this.logger.error(
            `[${Date.now()}] Jira API error: ${error.message}`,
            {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout,
              },
            },
          );
          throw new Error(`Failed to fetch projects: ${error.message}`);
        }
        throw error;
      }
    });
  }
}
