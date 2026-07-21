/**
 * Epic Explorer metrics roll-up (SLS-16808) — pure functions, no DB/network.
 *
 * WP + meeting SP are derived by REUSING `issueProcessingStrategyFactory`
 * (appendix weights via `wpWeights`), never hand-rolled. Story Points use the
 * raw Jira field (customfield_10005), roster-gated by the caller.
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
 */
export function buildDescendant(
  issue: JiraIssueEntity,
  wpWeights: WpWeights | undefined,
  rosterAccountIds: Set<string>,
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
  const storyPoint =
    attributable && !isMeeting && typeof rawSp === 'number' ? rawSp : null;

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
    sprint: resolveSprint(issue.fields.customfield_10020),
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

/** ADF (Atlassian Document Format) or plain string → plain text. */
export function adfToPlainText(description: unknown): string | null {
  if (description == null) return null;
  if (typeof description === 'string') return description.trim() || null;
  if (typeof description !== 'object') return null;

  const blocks: string[] = [];
  const walk = (node: unknown, buf: string[]): void => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === 'text' && typeof n.text === 'string') buf.push(n.text);
    if (n.type === 'hardBreak') buf.push('\n');
    if (Array.isArray(n.content)) {
      // Block-level nodes flush to their own line.
      const isBlock =
        n.type === 'paragraph' ||
        n.type === 'heading' ||
        n.type === 'listItem' ||
        n.type === 'blockquote' ||
        n.type === 'codeBlock';
      if (isBlock) {
        const inner: string[] = [];
        n.content.forEach(c => walk(c, inner));
        const line = inner.join('').trim();
        if (line) blocks.push(line);
      } else {
        n.content.forEach(c => walk(c, buf));
      }
    }
  };
  const root: string[] = [];
  walk(description, root);
  if (root.length) blocks.push(root.join('').trim());
  const text = blocks.filter(Boolean).join('\n').trim();
  return text || null;
}
