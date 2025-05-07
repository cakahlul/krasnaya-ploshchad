import { Injectable } from '@nestjs/common';
import { ProjectEntity, SprintEntity } from '../interfaces/project.entity';
import axios from 'axios';

@Injectable()
export class ProjectRepository {
  private url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };

  async fetchJiraSprint(boardId: number): Promise<SprintEntity> {
    //hardcoded logic startAt to exclude old sprint
    let startAt = 55;
    if (boardId == 143) {
      startAt = 32;
    }

    const response = await axios.get<SprintEntity>(
      `${this.url}/rest/agile/1.0/board/${boardId}/sprint?maxResults=100&startAt=${startAt}`,
      {
        auth: this.auth,
      },
    );
    return response.data;
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
