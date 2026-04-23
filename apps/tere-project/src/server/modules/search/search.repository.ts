import axios from 'axios'; // used for isAxiosError type guard only
import { jiraClient } from '@server/lib/jira.client';
import { SearchTicketDto, TicketDetailDto } from '@shared/types/search.types';
import { parseAppendixWeightPoints } from '@shared/utils/appendix-level';
import { boardsService } from '@server/modules/boards/boards.service';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';

const STATIC_ALLOWED_PROJECTS = ['ABB', 'BUZZ', 'REL', 'VUL', 'TAE', 'SRETASK'];

async function getAllowedProjects(): Promise<{ allowed: string[]; boardProjects: string[] }> {
  const boards = await boardsService.findAll();
  const boardProjects = boards.map(b => b.shortName.toUpperCase());
  return {
    allowed: [...new Set([...STATIC_ALLOWED_PROJECTS, ...boardProjects])],
    boardProjects,
  };
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

    const { allowed, boardProjects } = await getAllowedProjects();
    const escaped = query.trim().replace(/["\\]/g, '\\$&');
    const projectFilter = `project IN (${allowed.join(', ')})`;
    const upper = escaped.toUpperCase();
    const projectMatch = allowed.find((p) => upper === p || upper === `${p}-`);

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
      tickets: response.data.issues.map((i) => this.mapToSearchTicket(i, boardProjects)),
      total: response.data.total,
      nextPageToken: response.data.nextPageToken,
    };
  }

  async getTicketDetail(key: string): Promise<TicketDetailDto | null> {
    const projectKey = key.split('-')[0];
    const { allowed, boardProjects } = await getAllowedProjects();
    if (!allowed.includes(projectKey)) return null;

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
      const weights = await wpWeightConfigService.getEffectiveWeights(getTodayString());
      return this.mapToTicketDetail(response.data, boardProjects, weights);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw new Error('Failed to fetch ticket detail');
    }
  }

  private mapToSearchTicket(issue: JiraIssue, boardProjects: string[]): SearchTicketDto {
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    let resolution: string | undefined;
    if (boardProjects.includes(projectKey)) {
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

  private mapToTicketDetail(issue: JiraIssue, boardProjects: string[], appendixWeightMapping: WpWeights): TicketDetailDto {
    const projectKey = issue.fields.project?.key ?? issue.key.split('-')[0];
    let resolution: string | undefined;
    if (boardProjects.includes(projectKey)) {
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

    if (boardProjects.includes(projectKey)) {
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
      webUrl: `${process.env.JIRA_URL ?? ''}/browse/${issue.key}`,
    };
  }

  private extractText(description: unknown): string | null {
    if (!description) return null;
    if (typeof description === 'string') return description;
    if (typeof description === 'object' && description !== null) {
      const doc = description as { type?: string; content?: unknown[] };
      if (doc.type === 'doc' && Array.isArray(doc.content)) {
        return this.convertAdfNodesToHtml(doc.content);
      }
      if (Array.isArray(doc.content)) {
        return this.convertAdfNodesToHtml(doc.content);
      }
    }
    return null;
  }

  private convertAdfNodesToHtml(nodes: unknown[]): string {
    return nodes.map((node) => this.convertAdfNodeToHtml(node)).join('');
  }

  private convertAdfNodeToHtml(node: unknown): string {
    if (typeof node !== 'object' || node === null) return '';
    const n = node as {
      type?: string;
      text?: string;
      content?: unknown[];
      attrs?: Record<string, unknown>;
      marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
    };

    const children = Array.isArray(n.content) ? this.convertAdfNodesToHtml(n.content) : '';

    switch (n.type) {
      case 'text': {
        let text = this.escapeHtml(n.text ?? '');
        if (n.marks) {
          for (const mark of n.marks) {
            switch (mark.type) {
              case 'strong':
                text = `<strong>${text}</strong>`;
                break;
              case 'em':
                text = `<em>${text}</em>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
              case 'strike':
                text = `<s>${text}</s>`;
                break;
              case 'link':
                text = `<a href="${this.escapeHtml(String(mark.attrs?.href ?? ''))}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                break;
              case 'textColor':
                text = `<span style="color:${this.escapeHtml(String(mark.attrs?.color ?? ''))}">${text}</span>`;
                break;
            }
          }
        }
        return text;
      }
      case 'paragraph':
        return `<p>${children}</p>`;
      case 'heading': {
        const level = Math.min(Math.max(Number(n.attrs?.level) || 1, 1), 6);
        return `<h${level}>${children}</h${level}>`;
      }
      case 'bulletList':
        return `<ul>${children}</ul>`;
      case 'orderedList':
        return `<ol>${children}</ol>`;
      case 'listItem':
        return `<li>${children}</li>`;
      case 'blockquote':
        return `<blockquote>${children}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${children}</code></pre>`;
      case 'rule':
        return '<hr />';
      case 'hardBreak':
        return '<br />';
      case 'table':
        return `<table>${children}</table>`;
      case 'tableRow':
        return `<tr>${children}</tr>`;
      case 'tableHeader':
        return `<th>${children}</th>`;
      case 'tableCell':
        return `<td>${children}</td>`;
      case 'mediaSingle':
      case 'mediaGroup':
        return children;
      case 'media':
        return '';
      case 'mention':
        return `<span>@${this.escapeHtml(String(n.attrs?.text ?? ''))}</span>`;
      case 'emoji':
        return n.attrs?.text ? String(n.attrs.text) : '';
      case 'inlineCard':
        return `<a href="${this.escapeHtml(String(n.attrs?.url ?? ''))}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(String(n.attrs?.url ?? ''))}</a>`;
      case 'panel': {
        const panelType = n.attrs?.panelType ?? 'info';
        return `<div data-panel-type="${this.escapeHtml(String(panelType))}">${children}</div>`;
      }
      default:
        return children;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
