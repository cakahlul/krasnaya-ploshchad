import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SearchTicketDto, TicketDetailDto } from './interfaces/search.dto';

// Allowed boards for search
const ALLOWED_PROJECTS = ['ABB', 'SLS', 'DS', 'BUZZ', 'REL', 'VUL', 'TAE', 'SRETASK'];

interface JiraSearchResponse {
  total?: number;
  maxResults?: number;
  startAt?: number;
  isLast?: boolean;
  nextPageToken?: string;
  issues: JiraIssue[];
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory?: { colorName?: string };
    };
    resolution?: {
      name: string;
    } | null;
    assignee?: {
      displayName: string;
      avatarUrls?: { '24x24'?: string };
    };
    reporter?: {
      displayName: string;
      avatarUrls?: { '24x24'?: string };
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    issuetype?: {
      name: string;
      iconUrl?: string;
    };
    project?: {
      key: string;
      name?: string;
    };
    labels?: string[];
    description?: unknown;
    created?: string;
    updated?: string;
    customfield_10005?: number; // Story Points
    customfield_10020?: Array<{ name?: string }>; // Sprint
    customfield_11543?: number | { self: string; value: string; id: string } | Array<{ self: string; value: string; id: string }>; // Appendix v3 - can be object, array, or number
  };
}

@Injectable()
export class SearchJiraRepository {
  private readonly logger = new Logger(SearchJiraRepository.name);
  private readonly url = process.env.JIRA_URL ?? '';
  private readonly auth = {
    username: process.env.JIRA_USERNAME ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  };
  private readonly requestTimeout = 30000;

  /**
   * Search for tickets across all allowed projects
   */
  /**
   * Search for tickets across all allowed projects
   */
  async searchTickets(
    query: string,
    limit: number = 50,
    offset: number = 0, // Kept for interface compatibility but generally unused with token
    nextPageToken?: string,
  ): Promise<{ tickets: SearchTicketDto[]; total?: number; nextPageToken?: string }> {
    if (!query || query.trim().length === 0) {
      return { tickets: [], total: 0 };
    }

    // Escape special characters in query for JQL
    const escapedQuery = this.escapeJqlString(query.trim());
    
    // Build JQL - search in summary, description, and key
    const projectFilter = `project IN (${ALLOWED_PROJECTS.join(', ')})`;
    
    // Check if query looks like a project key (e.g. "SLS", "SLS-")
    const upperQuery = escapedQuery.toUpperCase();
    const projectKeyMatch = ALLOWED_PROJECTS.find(p => upperQuery === p || upperQuery === `${p}-`); // exact match or with dash

    let textFilter: string;
    if (projectKeyMatch) {
      // If query matches a known project (e.g. "SLS" or "SLS-"), return all tickets in that project
      // OR find occurrences of the term in other projects
      const cleanProjectKey = projectKeyMatch.replace(/-$/, '');
      textFilter = `(project = "${cleanProjectKey}" OR text ~ "${escapedQuery}*")`;
    } else {
      // General search: usage of 'text' field (summary, description, comments) + exact key match
      textFilter = `(key = "${escapedQuery}" OR text ~ "${escapedQuery}*")`;
    }

    const jql = `${projectFilter} AND ${textFilter} ORDER BY updated DESC`;

    // Use /rest/api/3/search/jql for token-based pagination
    const searchUrl = `${this.url}/rest/api/3/search/jql`;
    
    try {
      const response = await axios.post<JiraSearchResponse>(searchUrl, {
        jql,
        maxResults: limit,
        nextPageToken: nextPageToken || undefined, // Only send if present
        fields: [
          'summary',
          'status',
          'resolution',
          'assignee',
          'priority',
          'issuetype',
          'project',
          'updated',
        ],
      }, {
        auth: this.auth,
        timeout: this.requestTimeout,
      });

      const tickets = response.data.issues.map((issue) =>
        this.mapToSearchTicket(issue),
      );

      return {
        tickets,
        total: response.data.total, // Note: might be undefined in JQL search
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      const axiosError = error as any;
      this.logger.error('Error searching tickets', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: JSON.stringify(axiosError.response?.data),
        url: searchUrl,
      });
      throw new Error(`Failed to search tickets: ${axiosError.message}`);
    }
  }

  /**
   * Get full ticket details by issue key
   */
  async getTicketDetail(key: string): Promise<TicketDetailDto | null> {
    // Validate the key belongs to allowed projects
    const projectKey = key.split('-')[0];
    if (!ALLOWED_PROJECTS.includes(projectKey)) {
      this.logger.warn(`Attempted to access ticket from unauthorized project: ${projectKey}`);
      return null;
    }

    const issueUrl = `${this.url}/rest/api/3/issue/${key}`;

    try {
      const response = await axios.get<JiraIssue>(issueUrl, {
        auth: this.auth,
        params: {
          fields: [
            'summary',
            'description',
            'status',
            'resolution',
            'assignee',
            'reporter',
            'priority',
            'issuetype',
            'project',
            'labels',
            'created',
            'updated',
            'customfield_10005', // Story Points
            'customfield_10020', // Sprint
            'customfield_11543', // Appendix v3
          ].join(','),
        },
        timeout: this.requestTimeout,
      });

      return this.mapToTicketDetail(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.logger.error('Error fetching ticket detail', {
        key,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to fetch ticket detail');
    }
  }

  private mapToSearchTicket(issue: JiraIssue): SearchTicketDto {
    // Get resolution status - map status to resolution for SLS/DS
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    let resolution: string | undefined;
    if (['SLS', 'DS'].includes(projectKey)) {
      // Use resolution if available, otherwise derive from status
      if (issue.fields.resolution?.name) {
        resolution = 'Done';
      } else {
        const statusName = issue.fields.status?.name?.toLowerCase() ?? '';
        if (statusName.includes('done') || statusName.includes('closed')) {
          resolution = 'Done';
        } else if (statusName.includes('progress') || statusName.includes('review')) {
          resolution = 'In Progress';
        } else {
          resolution = 'To Do';
        }
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
    const sprint = issue.fields.customfield_10020?.[0]?.name;
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    
    // Derive resolution from status for SLS/DS
    let resolution: string | undefined;
    if (['SLS', 'DS'].includes(projectKey)) {
      if (issue.fields.resolution?.name) {
        resolution = 'Done';
      } else {
        const statusName = issue.fields.status?.name?.toLowerCase() ?? '';
        if (statusName.includes('done') || statusName.includes('closed')) {
          resolution = 'Done';
        } else if (statusName.includes('progress') || statusName.includes('review')) {
          resolution = 'In Progress';
        } else {
          resolution = 'To Do';
        }
      }
    }

    // Get Weight Complexity (formerly Appendix v3) for SLS/DS boards
    let appendixV3: number | string | string[] | undefined;
    if (['SLS', 'DS'].includes(projectKey)) {
      const field = issue.fields.customfield_11543;
      
      if (Array.isArray(field) && field.length > 0) {
        // Extract value from each object in the array
        const values = field
          .filter(item => typeof item === 'object' && item !== null && 'value' in item)
          .map(item => item.value);
        
        if (values.length > 0) {
          appendixV3 = values;
        }
      } else if (typeof field === 'object' && field !== null && 'value' in field) {
        appendixV3 = (field as { value: string }).value;
      } else if (typeof field === 'number' || typeof field === 'string') {
        appendixV3 = field;
      }
    }
    
    return {
      key: issue.key,
      summary: issue.fields.summary,
      description: this.extractTextFromDescription(issue.fields.description),
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
      sprint,
      storyPoints: issue.fields.customfield_10005,
      appendixV3,
      webUrl: `${this.url}/browse/${issue.key}`,
    };
  }

  /**
   * Extract plain text from Atlassian Document Format description
   */
  private extractTextFromDescription(description: unknown): string | null {
    if (!description) return null;
    
    if (typeof description === 'string') {
      return description;
    }

    // Handle Atlassian Document Format
    if (typeof description === 'object' && description !== null) {
      const doc = description as { content?: unknown[] };
      if (doc.content && Array.isArray(doc.content)) {
        return this.extractTextFromContent(doc.content);
      }
    }

    return null;
  }

  private extractTextFromContent(content: unknown[]): string {
    const texts: string[] = [];
    
    for (const node of content) {
      if (typeof node === 'object' && node !== null) {
        const typedNode = node as { type?: string; text?: string; content?: unknown[] };
        if (typedNode.type === 'text' && typedNode.text) {
          texts.push(typedNode.text);
        } else if (typedNode.content && Array.isArray(typedNode.content)) {
          texts.push(this.extractTextFromContent(typedNode.content));
        }
      }
    }

    return texts.join(' ').trim();
  }

  private escapeJqlString(value: string): string {
    // Escape special JQL characters
    return value.replace(/["\\]/g, '\\$&');
  }
}
