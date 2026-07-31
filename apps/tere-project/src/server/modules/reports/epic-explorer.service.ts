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
  JiraIssueEntity,
} from '@shared/types/report.types';
import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { membersService } from '@server/modules/members/members.service';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { todayInWib } from '@server/modules/wp-weight-config/wp-weight-config-date';
import * as repo from './reports.repository';
import {
  buildDescendant,
  rollupMetrics,
  resolveStatusCategory,
  resolveSprint,
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

function csv(value: string): string[] {
  return [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
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
  const projects = csv(project);
  if (projects.length === 0 || projects.some(item => !canAccess(item, accessible))) {
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
    description: epic.fields.description ?? null,
    created: epic.fields.created ?? null,
    updated: epic.fields.updated ?? null,
    sprint: resolveSprint(epic.fields.customfield_10007),
  };
}

/** SLS-16803: assemble the epic detail response. */
export async function getEpicDetail(
  epicKey: string,
  project: string,
  caller: CallerIdentity,
): Promise<EpicDetailResponse> {
  const accessible = await accessibleProjects(caller);
  const projects = csv(project).map(item => item.toUpperCase());
  const epicKeys = csv(epicKey).map(item => item.toUpperCase());
  if (projects.length === 0 || epicKeys.length === 0 || projects.some(item => !canAccess(item, accessible))) {
    throw new EpicExplorerError(403, 'You do not have access to this project');
  }
  if (epicKeys.some(key => !projects.includes(projectOf(key)))) {
    throw new EpicExplorerError(404, 'Epic not found in the selected projects');
  }

  let result: Awaited<ReturnType<typeof repo.fetchEpicsWithDescendants>>;
  try {
    result = await repo.fetchEpicsWithDescendants(epicKeys, projects);
  } catch (error) {
    if (isBadRequestError(error)) {
      throw new EpicExplorerError(404, `Epic ${epicKey} not found`);
    }
    throw new EpicExplorerError(502, 'Failed to fetch epic from Jira');
  }

  const epicIssue = result.epics[0] ?? null;
  if (
    !epicIssue
    || result.epics.length !== epicKeys.length
    || result.epics.some(epic => epic.fields.issuetype?.name !== 'Epic')
  ) {
    throw new EpicExplorerError(404, 'Epic not found');
  }
  const rawDescendants = result.descendants;

  const effectiveDate = todayInWib();
  const weights = await wpWeightConfigService.getEffectiveWeights(effectiveDate);
  const dailyTargetWPByLevel = await targetWpConfigService.getEffectiveRates(effectiveDate);

  const allMembers = await membersService.findAll();
  const rosterAccountIds = new Set(
    allMembers
      .map(m => m.jiraId)
      .filter((id): id is string => !!id)
      .map(id => id.toLowerCase()),
  );
  const dailyRateByAccountId = new Map(
    allMembers
      .filter((m): m is typeof m & { jiraId: string } => !!m.jiraId)
      .map(m => [m.jiraId.toLowerCase(), dailyTargetWPByLevel[m.level] ?? 8]),
  );
  const visible = rawDescendants.filter(d => canAccess(projectOf(d.key), accessible));
  const hiddenCount = rawDescendants.length - visible.length;
  const descendants = visible.map(issue =>
    buildDescendant(
      issue,
      weights,
      rosterAccountIds,
      dailyRateByAccountId.get(issue.fields.assignee?.accountId?.toLowerCase() ?? '') ?? 8,
    ),
  );

  return {
    epic: toEpicInfo(epicIssue),
    epics: result.epics.map(toEpicInfo),
    descendants,
    metrics: rollupMetrics(descendants),
    authz: { hiddenCount, totalFetched: rawDescendants.length },
    wpConfig: { effectiveDate, weights },
  };
}
