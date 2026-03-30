import axios from 'axios'; // used for isAxiosError type guard only
import { jiraClient } from '@server/lib/jira.client';
import { SearchTicketDto, TicketDetailDto } from '@shared/types/search.types';
import { parseAppendixWeightPoints, AppendixWeightPoint } from '@shared/utils/appendix-level';

const ALLOWED_PROJECTS = ['ABB', 'SLS', 'DS', 'BUZZ', 'REL', 'VUL', 'TAE', 'SRETASK'];

const appendixWeightMapping: Record<AppendixWeightPoint, number> = {
  'Very Low': 1.5,
  Low: 2,
  Medium: 4,
  High: 8,
};

interface JiraSearchResponse {
  total?: number;
  isLast?: boolean;
  nextPageToken?: string;
  issues: JiraIssue[];
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory?: { colorName?: string } };
    resolution?: { name: string } | null;
    assignee?: { displayName: string; avatarUrls?: { '24x24'?: string } };
    reporter?: { displayName: string; avatarUrls?: { '24x24'?: string } };
    priority?: { name: string; iconUrl?: string };
    issuetype?: { name: string; iconUrl?: string };
    project?: { key: string; name?: string };
    labels?: string[];
    description?: unknown;
    created?: string;
    updated?: string;
    customfield_10005?: number;
    customfield_10020?: Array<{ name?: string }>;
    customfield_11312?: { self: string; value: string; id: string };
    customfield_11543?: number | { self: string; value: string; id: string } | Array<{ self: string; value: string; id: string }>;
  };
}

const TIMEOUT = 30000;

export class SearchRepository {
  async searchTickets(
    query: string,
    limit = 50,
    _offset = 0,
    nextPageToken?: string,
  ): Promise<{ tickets: SearchTicketDto[]; total?: number; nextPageToken?: string }> {
    if (!query?.trim()) return { tickets: [], total: 0 };

    const escaped = query.trim().replace(/["\\]/g, '\\$&');
    const projectFilter = `project IN (${ALLOWED_PROJECTS.join(', ')})`;
    const upper = escaped.toUpperCase();
    const projectMatch = ALLOWED_PROJECTS.find((p) => upper === p || upper === `${p}-`);

    const textFilter = projectMatch
      ? `(project = "${projectMatch.replace(/-$/, '')}" OR text ~ "${escaped}*")`
      : `(key = "${escaped}" OR text ~ "${escaped}*")`;

    const jql = `${projectFilter} AND ${textFilter} ORDER BY updated DESC`;

    const response = await jiraClient.get<JiraSearchResponse>('/rest/api/3/search/jql', {
      params: {
        jql,
        maxResults: limit,
        nextPageToken: nextPageToken ?? undefined,
        fields: ['summary', 'status', 'resolution', 'assignee', 'priority', 'issuetype', 'project', 'updated'].join(','),
      },
      timeout: TIMEOUT,
    });

    return {
      tickets: response.data.issues.map((i) => this.mapToSearchTicket(i)),
      total: response.data.total,
      nextPageToken: response.data.nextPageToken,
    };
  }

  async getTicketDetail(key: string): Promise<TicketDetailDto | null> {
    const projectKey = key.split('-')[0];
    if (!ALLOWED_PROJECTS.includes(projectKey)) return null;

    try {
      const response = await jiraClient.get<JiraIssue>(`/rest/api/3/issue/${key}`, {
        params: {
          fields: [
            'summary', 'description', 'status', 'resolution', 'assignee', 'reporter',
            'priority', 'issuetype', 'project', 'labels', 'created', 'updated',
            'customfield_10005', 'customfield_10020', 'customfield_11312', 'customfield_11543',
          ].join(','),
        },
        timeout: TIMEOUT,
      });
      return this.mapToTicketDetail(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw new Error('Failed to fetch ticket detail');
    }
  }

  private mapToSearchTicket(issue: JiraIssue): SearchTicketDto {
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    let resolution: string | undefined;
    if (['SLS', 'DS'].includes(projectKey)) {
      if (issue.fields.resolution?.name) {
        resolution = 'Done';
      } else {
        const s = issue.fields.status?.name?.toLowerCase() ?? '';
        resolution = s.includes('done') || s.includes('closed') ? 'Done'
          : s.includes('progress') || s.includes('review') ? 'In Progress'
          : 'To Do';
      }
    }
    return {
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name ?? 'Unknown',
      statusColor: issue.fields.status?.statusCategory?.colorName,
      resolution,
      assignee: issue.fields.assignee?.displayName ?? null,
      assigneeAvatar: issue.fields.assignee?.avatarUrls?.['24x24'],
      priority: issue.fields.priority?.name ?? 'None',
      priorityIcon: issue.fields.priority?.iconUrl,
      issueType: issue.fields.issuetype?.name ?? 'Task',
      issueTypeIcon: issue.fields.issuetype?.iconUrl,
      projectKey,
      updated: issue.fields.updated ?? new Date().toISOString(),
    };
  }

  private mapToTicketDetail(issue: JiraIssue): TicketDetailDto {
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    let resolution: string | undefined;
    if (['SLS', 'DS'].includes(projectKey)) {
      if (issue.fields.resolution?.name) {
        resolution = 'Done';
      } else {
        const s = issue.fields.status?.name?.toLowerCase() ?? '';
        resolution = s.includes('done') || s.includes('closed') ? 'Done'
          : s.includes('progress') || s.includes('review') ? 'In Progress'
          : 'To Do';
      }
    }

    let appendixV3: number | string | string[] | undefined;
    let totalWeightPoints: number | undefined;

    if (['SLS', 'DS'].includes(projectKey)) {
      const field = issue.fields.customfield_11543;
      if (Array.isArray(field) && field.length > 0) {
        const values = field
          .filter((item): item is { self: string; value: string; id: string } =>
            typeof item === 'object' && item !== null && 'value' in item)
          .map((item) => {
            const level = parseAppendixWeightPoints(item.value);
            return level ? `${item.value} (${appendixWeightMapping[level]})` : item.value;
          });
        if (values.length > 0) appendixV3 = values;

        totalWeightPoints = field.reduce((sum, option) => {
          if (typeof option === 'object' && option !== null && 'value' in option) {
            const level = parseAppendixWeightPoints((option as { value: string }).value);
            if (level) return sum + appendixWeightMapping[level];
          }
          return sum;
        }, 0);
      } else if (typeof field === 'object' && field !== null && 'value' in field) {
        const f = field as { value: string };
        const level = parseAppendixWeightPoints(f.value);
        appendixV3 = level ? `${f.value} (${appendixWeightMapping[level]})` : f.value;
        if (level) totalWeightPoints = appendixWeightMapping[level];
      } else if (typeof field === 'number' || typeof field === 'string') {
        appendixV3 = field;
      }
    }

    return {
      key: issue.key,
      summary: issue.fields.summary,
      description: this.extractText(issue.fields.description),
      status: issue.fields.status?.name ?? 'Unknown',
      statusColor: issue.fields.status?.statusCategory?.colorName,
      resolution,
      assignee: issue.fields.assignee?.displayName ?? null,
      assigneeAvatar: issue.fields.assignee?.avatarUrls?.['24x24'],
      reporter: issue.fields.reporter?.displayName ?? null,
      reporterAvatar: issue.fields.reporter?.avatarUrls?.['24x24'],
      priority: issue.fields.priority?.name ?? 'None',
      priorityIcon: issue.fields.priority?.iconUrl,
      issueType: issue.fields.issuetype?.name ?? 'Task',
      issueTypeIcon: issue.fields.issuetype?.iconUrl,
      labels: issue.fields.labels ?? [],
      created: issue.fields.created ?? new Date().toISOString(),
      updated: issue.fields.updated ?? new Date().toISOString(),
      projectKey,
      projectName: issue.fields.project?.name ?? projectKey,
      sprint: issue.fields.customfield_10020?.[0]?.name,
      storyPoints: issue.fields.customfield_10005,
      spType: issue.fields.customfield_11312?.value,
      appendixV3,
      totalWeightPoints,
      webUrl: `${jiraBaseUrl}/browse/${issue.key}`,
    };
  }

  private extractText(description: unknown): string | null {
    if (!description) return null;
    if (typeof description === 'string') return description;
    if (typeof description === 'object' && description !== null) {
      const doc = description as { content?: unknown[] };
      if (Array.isArray(doc.content)) return this.extractTextFromContent(doc.content);
    }
    return null;
  }

  private extractTextFromContent(content: unknown[]): string {
    return content
      .flatMap((node) => {
        if (typeof node !== 'object' || node === null) return [];
        const n = node as { type?: string; text?: string; content?: unknown[] };
        if (n.type === 'text' && n.text) return [n.text];
        if (Array.isArray(n.content)) return [this.extractTextFromContent(n.content)];
        return [];
      })
      .join(' ')
      .trim();
  }
}
