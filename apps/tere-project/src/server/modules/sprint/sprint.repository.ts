import { jiraClient } from '@server/lib/jira.client';
import { Sprint, SprintEntity, ProjectEntity } from '@shared/types/sprint.types';

export class SprintRepository {
  async fetchJiraSprint(boardId: number): Promise<Sprint[]> {
    const base = `/rest/agile/1.0/board/${boardId}/sprint`;
    const cutoff = new Date(`${new Date().getFullYear() - 1}-01-01T00:00:00Z`);

    const activeRes = await jiraClient.get<SprintEntity>(`${base}?state=active`);
    const activeSprints = activeRes.data.values;

    const closedSprints: Sprint[] = [];
    const pageSize = 50;
    let startAt = 0;
    let isLast = false;

    while (!isLast) {
      const res = await jiraClient.get<SprintEntity>(
        `${base}?state=closed&maxResults=${pageSize}&startAt=${startAt}`,
      );
      isLast = res.data.isLast;
      startAt += pageSize;
      for (const sprint of res.data.values) {
        if (new Date(sprint.startDate) >= cutoff) {
          closedSprints.push(sprint);
        }
      }
    }

    return [...closedSprints, ...activeSprints];
  }

  async fetchJiraProject(): Promise<ProjectEntity[]> {
    const res = await jiraClient.get<ProjectEntity[]>('/rest/api/2/project');
    return res.data;
  }

  async fetchIssuesBySprintId(sprintId: number): Promise<any[]> {
    const allIssues: any[] = [];
    const pageSize = 100;
    let startAt = 0;
    let total = 0;

    do {
      const res = await jiraClient.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
        params: {
          maxResults: pageSize,
          startAt,
          fields: 'summary,created,resolutiondate,resolution,assignee,issuetype',
        },
      });
      total = res.data.total ?? 0;
      allIssues.push(...res.data.issues);
      startAt += pageSize;
    } while (startAt < total);

    return allIssues;
  }
}
