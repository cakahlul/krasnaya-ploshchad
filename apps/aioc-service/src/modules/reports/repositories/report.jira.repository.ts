import { Injectable } from '@nestjs/common';
import {
  JiraIssueEntity,
  JiraProjectEntity,
} from '../interfaces/report.entity';
import axios from 'axios';
import {
  JiraIssueDto,
  JiraSearchRequestDto,
  JiraSearchResponseDto,
} from '../interfaces/report.dto';

@Injectable()
export class ReportJiraRepository {
  private url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };

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

    const searchUrl = `${this.url}/rest/api/3/search`;
    const allIssues: JiraIssueEntity[] = [];
    let totalIssues = 0;
    let startAt = 0;
    const maxResults = 100; // Jira's default max is 100, using smaller chunks

    try {
      do {
        const response = await axios.get<JiraSearchResponseDto>(searchUrl, {
          auth: this.auth,
          params: {
            jql,
            startAt,
            maxResults,
            fields: [
              'summary',
              'customfield_10005', // Story Points
              'customfield_10796', // Story point type
              'customfield_10865', // Complexity (low/medium/high)
              'customfield_11015', // Weight of Complexity
              'assignee',
              'issuetype',
            ].join(','),
            validateQuery: 'strict', // Enable JQL validation
          },
          timeout: 30000,
        });

        totalIssues = response.data.total;
        startAt += response.data.issues.length;
        allIssues.push(...this.transformIssues(response.data.issues));

        // Respect rate limits (Jira's guideline: 1 request/second)
        // eslint-disable-next-line prettier/prettier
        await new Promise(resolve => setTimeout(resolve, 1000));
      } while (startAt < totalIssues);

      return allIssues;
    } catch (error) {
      console.error('Error fetching data from Jira:', error);
      throw new Error('Failed to fetch data from Jira');
    }
  }

  private transformIssues(issues: JiraIssueDto[]): JiraIssueEntity[] {
    return issues.map((issue: JiraIssueDto) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      fields: issue.fields,
    }));
  }
}
