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

    // Fetch active sprints and get closed sprint count in parallel
    const [activeResponse, closedCountResponse] = await Promise.all([
      axios.get<SprintEntity>(`${baseUrl}?state=active`, config),
      axios.get<SprintEntity>(`${baseUrl}?state=closed&maxResults=1`, config),
    ]);

    const activeSprints = activeResponse.data.values;

    // Calculate startAt to get only the last 6 closed sprints
    const closedTotal = closedCountResponse.data.total;
    const closedLimit = 6;
    const closedStartAt = Math.max(0, closedTotal - closedLimit);

    const closedResponse = await axios.get<SprintEntity>(
      `${baseUrl}?state=closed&maxResults=${closedLimit}&startAt=${closedStartAt}`,
      config,
    );

    const closedSprints = closedResponse.data.values;

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
