/**
 * Epic Explorer metrics roll-up (SLS-16808) — pure functions, no DB/network.
 *
 * WP + meeting SP are derived by REUSING `issueProcessingStrategyFactory`
 * (appendix weights via `wpWeights`), never hand-rolled. Story Points prefer
 * the raw Jira field (customfield_10005) when Jira has it populated; when
 * absent, fall back to Team Reporting's own WP→SP conversion
 * (`weightPoint * (8 / dailyRate)`, mirroring reports.service.ts's `spBase`)
 * so tickets with no raw SP field still get a derived value instead of N/A.
 */
import type {
  JiraIssueEntity,
  ExplorerDescendant,
  ExplorerMetrics,
  ExplorerCategory,
} from '@shared/types/report.types';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';
import {
  parseAppendixWeightPoints,
  isMeetingAppendixValue,
} from '@shared/utils/appendix-level';
import { issueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';

const round2 = (n: number): number => parseFloat(n.toFixed(2));

interface StatusBucket {
  bucket: 'toDo' | 'inProgress' | 'done';
  name: string;
}

const STATUS_BY_CATEGORY_KEY: Record<string, StatusBucket> = {
  new: { bucket: 'toDo', name: 'To Do' },
  indeterminate: { bucket: 'inProgress', name: 'In Progress' },
  done: { bucket: 'done', name: 'Done' },
};

/** Maps a Jira status category to our bucket + display name. */
export function resolveStatusCategory(issue: JiraIssueEntity): StatusBucket {
  const cat = issue.fields.status?.statusCategory;
  const byKey = cat?.key ? STATUS_BY_CATEGORY_KEY[cat.key] : undefined;
  if (byKey) return byKey;
  // Fallback: default to To Do, but surface any category name Jira gave us.
  return { bucket: 'toDo', name: cat?.name ?? 'To Do' };
}

function nameToBucket(statusCategory: string): 'toDo' | 'inProgress' | 'done' {
  if (statusCategory === 'Done') return 'done';
  if (statusCategory === 'In Progress') return 'inProgress';
  return 'toDo';
}

function extractMeetingSP(
  strategy: { calculateWeight: (i: JiraIssueEntity) => number; extractMeetingSP?: (i: JiraIssueEntity) => number },
  issue: JiraIssueEntity,
): number {
  return typeof strategy.extractMeetingSP === 'function'
    ? strategy.extractMeetingSP(issue)
    : 0;
}

/**
 * Resolves the "current" sprint name from Jira's customfield_10020 array.
 * Priority: sprint with state==='active' → last element (Jira appends
 * chronologically) → null ("No Sprint"). NOT [0] (that is the oldest).
 */
export function resolveSprint(sprints: Array<{ name?: string; state?: string }> | undefined): string | null {
  if (!sprints || sprints.length === 0) return null;
  const active = sprints.find(s => s?.state === 'active');
  return (active ?? sprints[sprints.length - 1])?.name ?? null;
}

/**
 * Builds the public descendant row for one issue.
 * @param rosterAccountIds lowercase Jira accountIds of roster members; storyPoint
 *   is null (N/A) when the assignee is unassigned or not on the roster.
 * @param dailyRate the assignee's level-based daily target WP (Team Reporting's
 *   `dailyTargetWPByLevel[level]`, default 8), used only as the SP fallback
 *   when Jira's customfield_10005 is empty.
 */
export function buildDescendant(
  issue: JiraIssueEntity,
  wpWeights: WpWeights | undefined,
  rosterAccountIds: Set<string>,
  dailyRate = 8,
): ExplorerDescendant {
  const strategies = issueProcessingStrategyFactory.createStrategies(issue, wpWeights);
  const { name: statusCategory } = resolveStatusCategory(issue);

  const options = issue.fields.customfield_11543 ?? [];
  const isMeeting = options.some(o => o?.value && isMeetingAppendixValue(o.value));
  const missingMetricData = options.length === 0;

  let appendixLevel: string | null = null;
  for (const o of options) {
    if (!o?.value || isMeetingAppendixValue(o.value)) continue;
    const level = parseAppendixWeightPoints(o.value);
    if (level) {
      appendixLevel = level;
      break;
    }
  }

  const weightPoint = strategies.complexityWeightStrategy.calculateWeight(issue);
  const spMeeting = extractMeetingSP(strategies.complexityWeightStrategy, issue);
  const category: ExplorerCategory =
    strategies.issueCategorizer.getWeightPointsCategory(issue) === 'weightPointsTechDebt'
      ? 'techDebt'
      : 'product';

  const accountId = issue.fields.assignee?.accountId ?? null;
  const attributable = accountId !== null && rosterAccountIds.has(accountId.toLowerCase());
  const rawSp = issue.fields.customfield_10005;
  // Meeting SP flows via spMeeting/extractMeetingSP; excluding it here prevents
  // a meeting ticket with customfield_10005 double-counting into product/techDebt.
  // spBase mirrors reports.service.ts: (8 * workingDays) / (dailyRate * workingDays) = 8 / dailyRate.
  // Fallback only when there IS a weightPoint — a ticket with neither raw SP nor
  // WP data stays N/A (null), not a misleading 0.
  const spBase = dailyRate > 0 ? 8 / dailyRate : 0;
  const storyPoint =
    !attributable || isMeeting
      ? null
      : typeof rawSp === 'number'
        ? rawSp
        : weightPoint > 0
          ? round2(weightPoint * spBase)
          : null;

  const issueTypeName = issue.fields.issuetype?.name ?? 'Unknown';
  const isDefect = issueTypeName === 'Defect' || issueTypeName === 'Bug';

  return {
    key: issue.key,
    summary: issue.fields.summary ?? '',
    issueType: issueTypeName,
    status: issue.fields.status?.name ?? 'Unknown',
    statusCategory,
    assignee: issue.fields.assignee?.displayName ?? null,
    assigneeAccountId: accountId,
    parentKey: issue.fields.parent?.key ?? null,
    appendixLevel,
    category,
    weightPoint: round2(weightPoint),
    isMeeting,
    storyPoint: storyPoint === null ? null : round2(storyPoint),
    spMeeting: round2(spMeeting),
    isDefect,
    missingMetricData,
    sprint: resolveSprint(issue.fields.customfield_10007),
    description: issue.fields.description ?? null,
    updatedAt: issue.fields.updated ?? '',
  };
}

/** Rolls up descendant rows into the aggregate metrics block. */
export function rollupMetrics(descendants: ExplorerDescendant[]): ExplorerMetrics {
  const statusCounts = { toDo: 0, inProgress: 0, done: 0 };
  let wpProduct = 0;
  let wpTechDebt = 0;
  let spProduct = 0;
  let spTechDebt = 0;
  let spMeeting = 0;
  let hasSpProduct = false;
  let hasSpTechDebt = false;
  let hasMeeting = false;
  let defectCount = 0;
  let withMetricData = 0;
  const missingMetricData: string[] = [];

  for (const d of descendants) {
    statusCounts[nameToBucket(d.statusCategory)] += 1;

    if (d.category === 'techDebt') wpTechDebt += d.weightPoint;
    else wpProduct += d.weightPoint;

    if (d.storyPoint !== null) {
      if (d.category === 'techDebt') {
        spTechDebt += d.storyPoint;
        hasSpTechDebt = true;
      } else {
        spProduct += d.storyPoint;
        hasSpProduct = true;
      }
    }
    if (d.spMeeting > 0 || d.isMeeting) {
      spMeeting += d.spMeeting;
      hasMeeting = true;
    }

    if (d.isDefect) defectCount += 1;
    if (d.missingMetricData) missingMetricData.push(d.key);
    else withMetricData += 1;
  }

  const total = descendants.length;
  const wpTotal = wpProduct + wpTechDebt;

  const productLeg = hasSpProduct ? round2(spProduct) : null;
  const techDebtLeg = hasSpTechDebt ? round2(spTechDebt) : null;
  const meetingLeg = hasMeeting ? round2(spMeeting) : null;
  const anySp = hasSpProduct || hasSpTechDebt || hasMeeting;
  const spTotal = anySp
    ? round2((productLeg ?? 0) + (techDebtLeg ?? 0) + (meetingLeg ?? 0))
    : null;

  return {
    statusCounts,
    completionByCount: {
      done: statusCounts.done,
      total,
      percent: total > 0 ? round2((statusCounts.done / total) * 100) : 0,
    },
    weightPoint: {
      product: round2(wpProduct),
      techDebt: round2(wpTechDebt),
      total: round2(wpTotal),
    },
    storyPoint: {
      product: productLeg,
      techDebt: techDebtLeg,
      meeting: meetingLeg,
      total: spTotal,
    },
    composition: {
      productPercent: wpTotal > 0 ? round2((wpProduct / wpTotal) * 100) : 0,
      techDebtPercent: wpTotal > 0 ? round2((wpTechDebt / wpTotal) * 100) : 0,
    },
    defectCount,
    coverage: { withMetricData, total },
    missingMetricCount: missingMetricData.length,
    missingMetricData,
  };
}
