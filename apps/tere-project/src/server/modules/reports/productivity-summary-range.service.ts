export type ReportingGroup = "Loan" | "Transaction" | "User" | "Ungrouped";
export type MetricBasis = "WP" | "SP";
export type MonthSource = "archive" | "live" | "partial" | "unavailable";
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
}

export interface RangeAggregationPorts {
  loadMonth(
    month: string,
    groups: ReportingGroup[],
  ): Promise<MonthSourceResult>;
  loadBugCount(month: string, group: ReportingGroup): Promise<number>;
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

function reason(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown source failure";
}

function addAvailable(left: number | null, right: number | null): number | null {
  return left === null || right === null ? null : left + right;
}

type LoadedMonth = {
  month: string;
  data: { members?: readonly SourceMember[] } | null;
  bugsRaised: number | null;
  bugsTotal: number | null;
  bugsDone: number | null;
  coverage: { source: MonthSource; productivityAvailable: boolean };
};

function chartPoint(month: LoadedMonth, metricBasis: MetricBasis) {
  const availableMembers = month.coverage.productivityAvailable ? month.data?.members ?? [] : null;
  const values = (availableMembers ?? []).map((member) =>
    metricBasis === "SP" ? member.spTotal : member.wpTotal,
  );
  const spTarget = availableMembers && availableMembers.every(member => member.spTarget !== null && member.spTarget !== undefined)
    ? availableMembers.reduce((sum, member) => sum + (member.spTarget ?? 0), 0)
    : null;
  const spTotal = availableMembers && availableMembers.every(member => member.spTotal !== null)
    ? availableMembers.reduce((sum, member) => sum + (member.spTotal ?? 0), 0)
    : null;
  return {
    month: month.month,
    activeMembers: availableMembers
      ? new Set(availableMembers.map((member) => member.id)).size
      : null,
    productivityMetric:
      availableMembers && values.every((value) => value !== null)
        ? (values as number[]).reduce((sum, value) => sum + value, 0)
        : null,
    productivityPercent: spTotal !== null && spTarget !== null && spTarget > 0
      ? (spTotal / spTarget) * 100
      : null,
    bugsRaised: month.bugsRaised,
    bugsTotal: month.bugsTotal,
    bugsDone: month.bugsDone,
    source: month.coverage.source,
    metricBasis,
  };
}

export type RangeProgressEvent =
  | { type: "point"; completed: number; total: number; point: ReturnType<typeof chartPoint> }
  | { type: "month"; completed: number; total: number; month: string; source: MonthSource };

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
        emit({ type: "month", completed, total, month: month.month, source: month.coverage.source });
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
            const [total, raised, done] = await Promise.all([
              ports.loadBugCount(month, group),
              ports.loadBugRaisedCount?.(month, group) ?? null,
              ports.loadBugDoneCount?.(month, group) ?? null,
            ]);
            return { total, raised, done };
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
      bugs.forEach((bug, index) => {
        if (bug.status === "rejected")
          failures.push({
            scope: "bugs",
            group: input.selectedGroups[index],
            reason: reason(bug.reason),
          });
      });
      const monthData = productivity.status === "fulfilled" ? productivity.value : null;
      const productivityAvailable = monthData !== null
        && monthData.source !== "unavailable"
        && (monthData.availability?.productivity ?? true);
      const bugsAvailable = bugs.every((bug) => bug.status === "fulfilled");
      const fulfilledBugs = bugs.filter(
        (bug): bug is PromiseFulfilledResult<{ total: number; raised: number | null; done: number | null }> => bug.status === "fulfilled",
      );
      const source: MonthSource = productivityAvailable
        ? failures.length || monthData?.source === "partial"
          ? "partial"
          : monthData!.source
        : "unavailable";
      console.log(
        `[telemetry] productivity-summary-range month durationMs=${Date.now() - monthStart} month=${month} source=${source}`,
      );
      const resolved = {
        month,
        data: monthData,
        bugsTotal: fulfilledBugs.length
          ? fulfilledBugs.reduce((sum, bug) => sum + bug.value.total, 0)
          : null,
        bugsRaised: fulfilledBugs.length
          ? fulfilledBugs.reduce((sum, bug) => sum + (bug.value.raised ?? bug.value.total), 0)
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
        },
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
        existing.spTotal = addAvailable(existing.spTotal, item.spTotal);
        existing.spTarget = addAvailable(existing.spTarget, item.spTarget ?? (item.workingDays === null ? null : item.workingDays * 8));
        existing.wpTotal = addAvailable(existing.wpTotal, item.wpTotal);
        existing.workingDays = existing.workingDays === null || item.workingDays === null
          ? existing.workingDays ?? item.workingDays
          : Math.max(existing.workingDays, item.workingDays);
      } else {
        aggregate.monthly.push({
          month: month.month,
          source: month.coverage.source,
          spTotal: item.spTotal,
          spTarget: item.spTarget ?? (item.workingDays === null ? null : item.workingDays * 8),
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
  }, { archive: 0, live: 0, partial: 0, unavailable: 0 });
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
    summary: {
      activeMembers: fullDetails.length,
      productivityMetric: chart.every(
        (point) => point.productivityMetric !== null,
      )
        ? chart.reduce((sum, point) => sum + point.productivityMetric!, 0)
        : null,
      productivityPercent: chart.every(point => point.productivityPercent !== null)
        ? (() => {
          const capacity = chart.reduce((sum, point) => sum + ((point.productivityMetric ?? 0) / (point.productivityPercent ?? 1)) * 100, 0);
          const sp = chart.reduce((sum, point) => sum + (point.productivityMetric ?? 0), 0);
          return capacity > 0 ? (sp / capacity) * 100 : null;
        })()
        : null,
      bugsRaised: chart.every((point) => point.bugsRaised !== null)
        ? chart.reduce((sum, point) => sum + point.bugsRaised!, 0)
        : null,
      bugsTotal: chart.every((point) => point.bugsTotal !== null)
        ? chart.reduce((sum, point) => sum + point.bugsTotal!, 0)
        : null,
      bugsDone: chart.every((point) => point.bugsDone !== null)
        ? chart.reduce((sum, point) => sum + point.bugsDone!, 0)
        : null,
    },
    details: input.callerName
      ? fullDetails.filter((member) => member.name === input.callerName)
      : fullDetails,
    chart,
  };
}
