import { Injectable } from '@nestjs/common';
import { ProjectEntity, Sprint, SprintEntity } from '../interfaces/project.entity';
import axios from 'axios';

@Injectable()
export class ProjectRepository {
  private url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };

  async fetchJiraSprint(boardId: number): Promise<Sprint[]> {
    const baseUrl = `${this.url}/rest/agile/1.0/board/${boardId}/sprint`;
    const config = { auth: this.auth };

    const lastYear = new Date().getFullYear() - 1;
    const yearStart = new Date(`${lastYear}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${lastYear}-12-31T23:59:59Z`);

    // Fetch active sprints
    const activeResponse = await axios.get<SprintEntity>(
      `${baseUrl}?state=active`,
      config,
    );
    const activeSprints = activeResponse.data.values;

    // Paginate through closed sprints, collecting those from last year
    const closedSprints: Sprint[] = [];
    const pageSize = 50;
    let startAt = 0;
    let isLast = false;

    while (!isLast) {
      const response = await axios.get<SprintEntity>(
        `${baseUrl}?state=closed&maxResults=${pageSize}&startAt=${startAt}`,
        config,
      );

      const { values, isLast: last } = response.data;
      isLast = last;
      startAt += pageSize;

      for (const sprint of values) {
        const sprintStart = new Date(sprint.startDate);
        if (sprintStart >= yearStart && sprintStart <= yearEnd) {
          closedSprints.push(sprint);
        }
      }
    }

    return [...closedSprints, ...activeSprints];
  }

  async fetchJiraProject(): Promise<ProjectEntity[]> {
    const response = await axios.get<ProjectEntity[]>(
      `${this.url}/rest/api/2/project`,
      {
        auth: this.auth,
      },
    );
    return response.data;
  }
}
