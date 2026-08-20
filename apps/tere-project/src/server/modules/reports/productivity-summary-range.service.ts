import type { ReportSourceAttempt, ReportSourceMetadata } from '@server/modules/report-source-resolver/report-source-resolver';

export type ReportingGroup = "Loan" | "Transaction" | "User" | "Ungrouped";
export type MetricBasis = "WP" | "SP";
export type MonthSource = "archive" | "snapshot" | "live" | "partial" | "unavailable";
export type RuleVersion = "legacy" | "new" | "v3" | "issue-field-presence";

export interface SourceMember {
  id: string;
  name: string;
  group: ReportingGroup;
  board: string;
  boards?: string[];
  spTotal: number | null;
  spTarget?: number | null;
  wpTotal: number | null;
  workingDays: number | null;
}

export interface MonthSourceResult {
  source: MonthSource;
  members: SourceMember[];
  appliedRules: Array<{ group: ReportingGroup; ruleVersion: RuleVersion }>;
  availability?: { productivity: boolean };
  archiveBacked?: boolean;
  failures?: Failure[];
  snapshotTimestamp?: string;
  attempts?: readonly ReportSourceAttempt[];
}

export interface RangeAggregationPorts {
  loadMonth(
    month: string,
    groups: ReportingGroup[],
  ): Promise<MonthSourceResult>;
  loadBugRaisedCount?(month: string, group: ReportingGroup): Promise<number>;
  loadBugDoneCount?(month: string, group: ReportingGroup): Promise<number>;
}

export interface RangeAggregationInput {
  months: string[];
  selectedGroups: ReportingGroup[];
  metricBasis: MetricBasis;
  callerName?: string;
}

export interface Failure {
  scope: "productivity" | "bugs";
  group?: ReportingGroup;
  board?: string;
  reason: string;
}

export interface BugMetadata {
  source: "jira";
  coverage: { status: "complete" | "partial" | "unavailable"; expected: number; covered: number };
  failure: string | null;
  snapshotTimestamp: null;
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown source failure";
}

function addAvailable(left: number | null, right: number | null): number | null {
  return left === null || right === null ? null : left + right;
}

/** One working day of capacity, in story points — the constant the SP target is built from. */
export const SP_PER_WORKING_DAY = 8;

/**
 * A live source reports working days and leaves the target implied; an archived one reports the
 * target directly. Both the chart and the member rows must read a member the same way, or the same
 * person shows a target in the table and none on the chart.
 */
function memberSpTarget(member: SourceMember): number | null {
  if (member.spTarget !== null && member.spTarget !== undefined) return member.spTarget;
  return member.workingDays === null || member.workingDays === undefined
    ? null
    : member.workingDays * SP_PER_WORKING_DAY;
}

type LoadedMonth = {
  month: string;
  data: { members?: readonly SourceMember[] } | null;
  bugsRaised: number | null;
  bugsDone: number | null;
  coverage: { source: MonthSource; productivityAvailable: boolean; failures: Failure[]; attempts: readonly ReportSourceAttempt[]; fallback: boolean };
  snapshotTimestamp?: string;
  bugMetadata: BugMetadata;
};

/**
 * Sum the members that reported a value. A single member missing one used to null the whole month,
 * so a fully-covered range still drew a broken line and an N/A headline; null now means nobody in
 * the month reported the value at all.
 */
function sumAvailable(values: readonly (number | null | undefined)[]): number | null {
  const present = values.filter((value): value is number => value !== null && value !== undefined);
  return present.length === 0 ? null : present.reduce((sum, value) => sum + value, 0);
}

function chartPoint(month: LoadedMonth, metricBasis: MetricBasis) {
  const availableMembers = month.coverage.productivityAvailable ? month.data?.members ?? [] : null;
  const values = (availableMembers ?? []).map((member) =>
    metricBasis === "SP" ? member.spTotal : member.wpTotal,
  );
  const spTarget = availableMembers ? sumAvailable(availableMembers.map(memberSpTarget)) : null;
  const spTotal = availableMembers ? sumAvailable(availableMembers.map(member => member.spTotal)) : null;
  return {
    month: month.month,
    activeMembers: availableMembers
      ? new Set(availableMembers.map((member) => member.id)).size
      : null,
    productivityMetric: availableMembers ? sumAvailable(values) : null,
    productivityPercent: spTotal !== null && spTarget !== null && spTarget > 0
      ? (spTotal / spTarget) * 100
      : null,
    spTotal,
    spTarget,
    bugsRaised: month.bugsRaised,
    bugsDone: month.bugsDone,
    source: month.coverage.source,
    fallback: month.coverage.fallback,
    metricBasis,
  };
}

export type RangeProgressEvent =
  | { type: "point"; completed: number; total: number; point: ReturnType<typeof chartPoint> }
  | { type: "month"; completed: number; total: number; month: string; source: MonthSource; fallback: boolean };

/**
 * Emits a chart point per month as it resolves, but only once the metric basis is settled — a
 * single archived month forces the whole range to SP, so publishing a WP point before that is
 * known would mix two units under one label. Months that resolve before the basis is decided are
 * announced without values and their points flushed as soon as it is.
 */
function createProgressPublisher(
  requestedBasis: MetricBasis,
  total: number,
  emit: (event: RangeProgressEvent) => void,
) {
  const pending: LoadedMonth[] = [];
  let basis: MetricBasis | null = null;
  let completed = 0;

  const flush = () => {
    if (basis === null) return;
    for (const month of pending.splice(0)) {
      emit({ type: "point", completed, total, point: chartPoint(month, basis) });
    }
  };

  return {
    publish(month: LoadedMonth) {
      completed += 1;
      if (basis === null && month.coverage.source === "archive") basis = "SP";
      pending.push(month);
      if (basis === null) {
        emit({ type: "month", completed, total, month: month.month, source: month.coverage.source, fallback: month.coverage.fallback });
        return;
      }
      flush();
    },
    settle(finalBasis: MetricBasis) {
      basis = finalBasis;
      flush();
    },
  };
}

export async function generateProductivitySummaryRange(
  input: RangeAggregationInput,
  ports: RangeAggregationPorts,
  onProgress?: (event: RangeProgressEvent) => void,
) {
  const rangeStart = Date.now();
  const publisher = onProgress
    ? createProgressPublisher(input.metricBasis, input.months.length, onProgress)
    : null;
  const loaded = await Promise.all(
    input.months.map(async (month) => {
      const monthStart = Date.now();
      const [productivity, ...bugs] = await Promise.allSettled([
        ports.loadMonth(month, input.selectedGroups),
        ...input.selectedGroups.map((group) =>
          (async () => {
            const [raised, done] = await Promise.all([
              ports.loadBugRaisedCount?.(month, group) ?? null,
              ports.loadBugDoneCount?.(month, group) ?? null,
            ]);
            return { raised, done };
          })(),
        ),
      ]);
      const failures: Failure[] = productivity.status === "fulfilled"
        ? [...(productivity.value.failures ?? [])]
        : [];
      if (productivity.status === "rejected")
        failures.push({
          scope: "productivity",
          reason: reason(productivity.reason),
        });
      const bugFailures = bugs
        .filter((bug): bug is PromiseRejectedResult => bug.status === "rejected")
        .map(bug => reason(bug.reason));
      const monthData = productivity.status === "fulfilled" ? productivity.value : null;
      const productivityAvailable = monthData !== null
        && monthData.source !== "unavailable"
        && (monthData.availability?.productivity ?? true);
      const bugsAvailable = bugs.every((bug) => bug.status === "fulfilled");
      const fulfilledBugs = bugs.filter(
        (bug): bug is PromiseFulfilledResult<{ raised: number | null; done: number | null }> => bug.status === "fulfilled",
      );
      const source: MonthSource = productivityAvailable
        ? failures.length || monthData?.source === "partial"
          ? "partial"
          : monthData!.source
        : "unavailable";
      const attempts = monthData?.attempts ?? [{ source: source === 'live' ? 'jira' : source === 'snapshot' ? 'snapshot' : 'archive', detail: failures[0]?.reason ?? null }];
      const fallback = source === 'live'
        && attempts.some(attempt => attempt.source === 'jira')
        && attempts.some(attempt => attempt.source !== 'jira');
      console.log(
        `[telemetry] productivity-summary-range month durationMs=${Date.now() - monthStart} month=${month} source=${source}`,
      );
      const monthBugMetadata: BugMetadata = {
        source: "jira",
        coverage: {
          status: bugsAvailable ? "complete" : fulfilledBugs.length ? "partial" : "unavailable",
          expected: bugs.length,
          covered: fulfilledBugs.length,
        },
        failure: bugFailures[0] ?? null,
        snapshotTimestamp: null,
      };
      const resolved = {
        month,
        data: monthData,
        bugsRaised: fulfilledBugs.length
          ? fulfilledBugs.reduce((sum, bug) => sum + (bug.value.raised ?? 0), 0)
          : null,
        bugsDone: fulfilledBugs.length
          ? fulfilledBugs.reduce((sum, bug) => sum + (bug.value.done ?? 0), 0)
          : null,
        coverage: {
          month,
          source,
          productivityAvailable,
          bugsAvailable,
          appliedRules: monthData?.appliedRules ?? [],
          failures,
          attempts,
          fallback,
        },
        snapshotTimestamp: monthData?.snapshotTimestamp,
        bugMetadata: monthBugMetadata,
      };
      publisher?.publish(resolved);
      return resolved;
    }),
  );

  const hasArchive = loaded.some((month) =>
    month.data?.source === "archive" || month.data?.archiveBacked === true,
  );
  const metricBasis: MetricBasis = hasArchive ? "SP" : input.metricBasis;
  publisher?.settle(metricBasis);
  const members = new Map<
    string,
    {
      name: string;
      group: ReportingGroup;
      boards: Set<string>;
      monthly: Array<{
        month: string;
        source: MonthSource;
        fallback: boolean;
        spTotal: number | null;
        spTarget: number | null;
        wpTotal: number | null;
        workingDays: number | null;
      }>;
    }
  >();
  for (const month of loaded)
    for (const item of month.coverage.productivityAvailable ? month.data?.members ?? [] : []) {
      const aggregate = members.get(item.id) ?? {
        name: item.name,
        group: item.group,
        boards: new Set<string>(),
        monthly: [],
      };
      for (const board of item.boards ?? [item.board]) aggregate.boards.add(board);
      const existing = aggregate.monthly.find(value => value.month === month.month);
      if (existing) {
        existing.fallback ||= month.coverage.fallback;
        existing.spTotal = addAvailable(existing.spTotal, item.spTotal);
        existing.spTarget = addAvailable(existing.spTarget, memberSpTarget(item));
        existing.wpTotal = addAvailable(existing.wpTotal, item.wpTotal);
        existing.workingDays = existing.workingDays === null || item.workingDays === null
          ? existing.workingDays ?? item.workingDays
          : Math.max(existing.workingDays, item.workingDays);
      } else {
        aggregate.monthly.push({
          month: month.month,
          source: month.coverage.source,
          fallback: month.coverage.fallback,
          spTotal: item.spTotal,
          spTarget: memberSpTarget(item),
          wpTotal: item.wpTotal,
          workingDays: item.workingDays,
        });
      }
      members.set(item.id, aggregate);
    }
  const fullDetails = [...members.values()]
    .map((member) => ({ ...member, boards: [...member.boards].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const chart = loaded.map((month) => chartPoint(month, metricBasis));
  const sourceDistribution = loaded.reduce<Record<MonthSource, number>>((acc, month) => {
    acc[month.coverage.source] = (acc[month.coverage.source] ?? 0) + 1;
    return acc;
  }, { archive: 0, snapshot: 0, live: 0, partial: 0, unavailable: 0 });
  const attempts = loaded.flatMap(month => month.coverage.attempts);
  const resolvedSources = [...new Set(loaded.map(month => month.coverage.source))];
  const aggregateSource: ReportSourceMetadata['source'] = resolvedSources.length === 1
    ? resolvedSources[0] === 'live' ? 'jira' : resolvedSources[0]
    : 'mixed';
  const hasFallback = loaded.some(month => month.coverage.fallback
    || month.coverage.source === 'partial'
    || month.coverage.failures.length > 0);
  const hasIncompleteCoverage = resolvedSources.some(source => source === 'partial' || source === 'unavailable');
  const fallbackReason = loaded
    .filter(month => month.coverage.fallback)
    .flatMap(month => month.coverage.attempts)
    .find(attempt => attempt.detail)?.detail ?? null;
  const sourceMetadata: ReportSourceMetadata = {
    source: aggregateSource,
    coverage: {
      status: loaded.every(month => month.coverage.source !== 'partial' && month.coverage.source !== 'unavailable')
        ? 'complete'
        : loaded.some(month => month.coverage.source !== 'unavailable') ? 'partial' : 'unavailable',
      expected: loaded.length,
      covered: loaded.filter(month => month.coverage.source !== 'unavailable').length,
    },
    fallback: hasFallback,
    reason: loaded.flatMap(month => month.coverage.failures).find(Boolean)?.reason ?? fallbackReason,
    warning: hasFallback && aggregateSource === 'jira'
      ? 'Using Jira after stored source fallback'
      : hasIncompleteCoverage
      ? 'Report coverage is incomplete'
      : hasFallback ? 'Source fallback was used' : null,
    attemptedSources: attempts.map(attempt => ({ source: attempt.source, detail: attempt.detail ?? null })),
    snapshotTimestamp: resolvedSources.length === 1 && resolvedSources[0] === 'snapshot'
      ? loaded.every(month => month.snapshotTimestamp === loaded[0]?.snapshotTimestamp)
        ? loaded[0]?.snapshotTimestamp ?? null : null
      : null,
  };
  const bugMetadata: BugMetadata = {
    source: "jira",
    coverage: {
      status: loaded.every(month => month.bugMetadata.coverage.status === "complete")
        ? "complete"
        : loaded.some(month => month.bugMetadata.coverage.status !== "unavailable") ? "partial" : "unavailable",
      expected: loaded.reduce((sum, month) => sum + month.bugMetadata.coverage.expected, 0),
      covered: loaded.reduce((sum, month) => sum + month.bugMetadata.coverage.covered, 0),
    },
    failure: loaded.map(month => month.bugMetadata.failure).find(Boolean) ?? null,
    snapshotTimestamp: null,
  };
  console.log(
    `[telemetry] productivity-summary-range total durationMs=${Date.now() - rangeStart} monthCount=${input.months.length} distribution=${JSON.stringify(sourceDistribution)}`,
  );
  return {
    range: {
      startMonth: input.months[0],
      endMonth: input.months.at(-1),
      monthCount: input.months.length,
    },
    selectedGroups: input.selectedGroups,
    metricBasis,
    coverage: {
      complete: loaded.every((month) =>
        month.coverage.failures.length === 0
        && month.coverage.source !== "partial"
        && month.coverage.source !== "unavailable"
        && month.coverage.productivityAvailable
        && month.coverage.bugsAvailable,
      ),
      months: loaded.map((month) => month.coverage),
    },
    sourceMetadata,
    bugMetadata,
    summary: {
      activeMembers: fullDetails.length,
      productivityMetric: sumAvailable(chart.map((point) => point.productivityMetric)),
      // Sum the underlying SP and its target rather than reverse-engineering capacity out of each
      // month's percentage: that divided by a percentage which can be zero, and under a WP basis it
      // divided WP output by an SP-derived percentage, so the headline figure was not a percentage
      // of anything.
      productivityPercent: (() => {
        const target = sumAvailable(chart.map((point) => point.spTarget));
        const delivered = sumAvailable(chart.map((point) => point.spTotal));
        return target !== null && delivered !== null && target > 0 ? (delivered / target) * 100 : null;
      })(),
      bugsRaised: sumAvailable(chart.map((point) => point.bugsRaised)),
      bugsDone: sumAvailable(chart.map((point) => point.bugsDone)),
    },
    details: input.callerName
      ? fullDetails.filter((member) => member.name === input.callerName)
      : fullDetails,
    chart,
  };
}
