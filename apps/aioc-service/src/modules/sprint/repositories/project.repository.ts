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
    timeout: 10000, // 10 second timeout
    auth: this.auth,
  });

  async fetchJiraSprint(boardId: number): Promise<SprintEntity> {
    try {
      //hardcoded logic startAt to exclude old sprint
      let startAt = this.limitFetch;
      if (boardId == 143) {
        startAt = 32;
      }

      this.logger.log(
        `Fetching sprints for board ${boardId} with startAt ${startAt}`,
      );
      const response = await this.axiosInstance.get<SprintEntity>(
        `${this.url}/rest/agile/1.0/board/${boardId}/sprint?maxResults=50&startAt=${startAt}`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Jira API error: ${error.message}`,
          error.response?.data,
        );
        throw new Error(`Failed to fetch sprints: ${error.message}`);
      }
      throw error;
    }
  }

  async fetchJiraProject(): Promise<ProjectEntity[]> {
    try {
      this.logger.log('Fetching all projects');
      const response = await this.axiosInstance.get<ProjectEntity[]>(
        `${this.url}/rest/api/2/project`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Jira API error: ${error.message}`,
          error.response?.data,
        );
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }
      throw error;
    }
  }
}
