/**
 * Epic Explorer service (SLS-16799 list branch, SLS-16803 detail assembly,
 * SLS-16811 project-level authz).
 *
 * FR-09 anti-collapse: Jira failure → 502 (never 200-empty); epic-not-found →
 * 404; empty epic → 200 with descendants: []. These are distinct.
 */
import type {
  ExplorerEpicListItem,
  EpicDetailResponse,
  ExplorerEpicInfo,
  ExplorerDescendant,
  JiraIssueEntity,
} from '@shared/types/report.types';
import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { membersService } from '@server/modules/members/members.service';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { todayInWib } from '@server/modules/wp-weight-config/wp-weight-config-date';
import * as repo from './reports.repository';
import {
  buildDescendant,
  rollupMetrics,
  resolveStatusCategory,
  adfToPlainText,
} from './epic-explorer.metrics';

export class EpicExplorerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'EpicExplorerError';
  }
}

function isBadRequestError(error: unknown): boolean {
  return !!(
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 400
  );
}

function projectOf(issueKey: string): string {
  return issueKey.split('-')[0]?.toUpperCase() ?? '';
}

/**
 * Resolves which projects the caller may see.
 * Lead → all (returns null = unrestricted). Non-lead → their roster teams.
 */
async function accessibleProjects(caller: CallerIdentity): Promise<Set<string> | null> {
  if (caller.isLead) return null;
  const member = await membersService.findByEmail(caller.email);
  const teams = member?.teams ?? [];
  return new Set(teams.map(t => t.toUpperCase()));
}

function canAccess(project: string, accessible: Set<string> | null): boolean {
  return accessible === null || accessible.has(project.toUpperCase());
}

/** SLS-16799: project-wide epic list (NOT assignee-scoped). */
export async function getProjectEpics(
  project: string,
  caller: CallerIdentity,
): Promise<ExplorerEpicListItem[]> {
  const accessible = await accessibleProjects(caller);
  if (!canAccess(project, accessible)) {
    throw new EpicExplorerError(403, 'You do not have access to this project');
  }

  let rawEpics: JiraIssueEntity[];
  try {
    rawEpics = await repo.fetchProjectEpics(project);
  } catch (error) {
    if (isBadRequestError(error)) {
      // Bad project key — treat as client error rather than upstream failure.
      throw new EpicExplorerError(400, 'Invalid project');
    }
    throw new EpicExplorerError(502, 'Failed to fetch epics from Jira');
  }

  return rawEpics.map(epic => ({
    key: epic.key,
    summary: epic.fields.summary ?? '',
    status: epic.fields.status?.name ?? 'Unknown',
    statusCategory: resolveStatusCategory(epic).name,
  }));
}

function toEpicInfo(epic: JiraIssueEntity): ExplorerEpicInfo {
  return {
    key: epic.key,
    summary: epic.fields.summary ?? '',
    status: epic.fields.status?.name ?? 'Unknown',
    statusCategory: resolveStatusCategory(epic).name,
    assignee: epic.fields.assignee?.displayName ?? null,
    description: adfToPlainText(epic.fields.description),
    created: epic.fields.created ?? null,
    updated: epic.fields.updated ?? null,
  };
}

/** SLS-16803: assemble the epic detail response. */
export async function getEpicDetail(
  epicKey: string,
  project: string,
  caller: CallerIdentity,
): Promise<EpicDetailResponse> {
  // Authorize against the EPIC'S OWN project (encoded in epicKey), NOT the
  // client-supplied `project` param — the two can disagree, and trusting the
  // param leaks the epic header of a project the caller can't access
  // (OWASP A01 / see review-lessons). The param must match the key's project.
  const epicProject = projectOf(epicKey);
  if (epicProject !== project.toUpperCase()) {
    throw new EpicExplorerError(404, `Epic ${epicKey} not found`);
  }

  const accessible = await accessibleProjects(caller);
  if (!canAccess(epicProject, accessible)) {
    throw new EpicExplorerError(403, 'You do not have access to this project');
  }

  let epicIssue: JiraIssueEntity | null;
  let rawDescendants: JiraIssueEntity[];
  try {
    const result = await repo.fetchEpicWithDescendants(epicKey);
    epicIssue = result.epic;
    rawDescendants = result.descendants;
  } catch (error) {
    // A 400 from Jira for `issuekey = KEY` means the epic doesn't exist → 404.
    if (isBadRequestError(error)) {
      throw new EpicExplorerError(404, `Epic ${epicKey} not found`);
    }
    throw new EpicExplorerError(502, 'Failed to fetch epic from Jira');
  }
  if (!epicIssue) {
    throw new EpicExplorerError(404, `Epic ${epicKey} not found`);
  }
  // Reject a non-Epic key (Story/subtask): this endpoint is epic-only.
  if (epicIssue.fields.issuetype?.name !== 'Epic') {
    throw new EpicExplorerError(404, `Epic ${epicKey} not found`);
  }

  const totalFetched = rawDescendants.length;
  // Hide descendants in projects the caller cannot access (cross-project only).
  const visible = rawDescendants.filter(d => canAccess(projectOf(d.key), accessible));
  const hiddenCount = totalFetched - visible.length;

  const effectiveDate = todayInWib();
  const weights = await wpWeightConfigService.getEffectiveWeights(effectiveDate);

  const allMembers = await membersService.findAll();
  const rosterAccountIds = new Set(
    allMembers
      .map(m => m.jiraId)
      .filter((id): id is string => !!id)
      .map(id => id.toLowerCase()),
  );

  const descendants: ExplorerDescendant[] = visible.map(issue =>
    buildDescendant(issue, weights, rosterAccountIds),
  );

  return {
    epic: toEpicInfo(epicIssue),
    descendants,
    metrics: rollupMetrics(descendants),
    authz: { hiddenCount, totalFetched },
    wpConfig: { effectiveDate, weights },
  };
}
