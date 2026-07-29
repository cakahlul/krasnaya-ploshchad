export type ReportingGroup = "Loan" | "Transaction" | "User" | "Ungrouped";
export type MetricBasis = "WP" | "SP";
export type MonthSource = "archive" | "live" | "partial" | "unavailable";
export type RuleVersion = "legacy" | "new" | "v3" | "issue-field-presence";

export interface SourceMember {
  id: string;
  name: string;
  group: ReportingGroup;
  board: string;
  spTotal: number | null;
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

export async function generateProductivitySummaryRange(
  input: RangeAggregationInput,
  ports: RangeAggregationPorts,
) {
  const loaded = await Promise.all(
    input.months.map(async (month) => {
      const [productivity, ...bugs] = await Promise.allSettled([
        ports.loadMonth(month, input.selectedGroups),
        ...input.selectedGroups.map((group) =>
          ports.loadBugCount(month, group),
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
        (bug): bug is PromiseFulfilledResult<number> => bug.status === "fulfilled",
      );
      return {
        month,
        data: monthData,
        bugsRaised: fulfilledBugs.length
          ? fulfilledBugs.reduce((sum, bug) => sum + bug.value, 0)
          : null,
        coverage: {
          month,
          source: (productivityAvailable
            ? failures.length || monthData?.source === "partial"
              ? "partial"
              : monthData!.source
            : "unavailable") as MonthSource,
          productivityAvailable,
          bugsAvailable,
          appliedRules: monthData?.appliedRules ?? [],
          failures,
        },
      };
    }),
  );

  const hasArchive = loaded.some((month) =>
    month.data?.source === "archive" || month.data?.archiveBacked === true,
  );
  const metricBasis: MetricBasis = hasArchive ? "SP" : input.metricBasis;
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
      aggregate.boards.add(item.board);
      aggregate.monthly.push({
        month: month.month,
        source: month.coverage.source,
        spTotal: item.spTotal,
        wpTotal: item.wpTotal,
        workingDays: item.workingDays,
      });
      members.set(item.id, aggregate);
    }
  const fullDetails = [...members.values()]
    .map((member) => ({ ...member, boards: [...member.boards].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const chart = loaded.map((month) => {
    const availableMembers = month.coverage.productivityAvailable ? month.data?.members ?? [] : null;
    const values = (availableMembers ?? []).map((member) =>
      metricBasis === "SP" ? member.spTotal : member.wpTotal,
    );
    return {
      month: month.month,
      activeMembers: availableMembers
        ? new Set(availableMembers.map((member) => member.id)).size
        : null,
      productivityMetric:
        availableMembers && values.every((value) => value !== null)
          ? (values as number[]).reduce((sum, value) => sum + value, 0)
          : null,
      bugsRaised: month.bugsRaised,
      source: month.coverage.source,
      metricBasis,
    };
  });
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
      bugsRaised: chart.every((point) => point.bugsRaised !== null)
        ? chart.reduce((sum, point) => sum + point.bugsRaised!, 0)
        : null,
    },
    details: input.callerName
      ? fullDetails.filter((member) => member.name === input.callerName)
      : fullDetails,
    chart,
  };
}
