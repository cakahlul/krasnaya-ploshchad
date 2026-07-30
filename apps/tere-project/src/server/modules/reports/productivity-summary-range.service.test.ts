import assert from "node:assert/strict";
import {
  generateProductivitySummaryRange,
  type RangeAggregationPorts,
} from "./productivity-summary-range.service";

const bugCalls: string[] = [];
const ports: RangeAggregationPorts = {
  loadMonth: async (month) =>
    month === "2025-12"
      ? {
          source: "archive",
          appliedRules: [{ group: "Loan", ruleVersion: "legacy" }],
          members: [
            {
              id: "a",
              name: "A",
              group: "Loan",
              board: "L1",
              spTotal: 8,
              wpTotal: null,
              workingDays: 1,
            },
          ],
        }
      : {
          source: "live",
          appliedRules: [{ group: "Loan", ruleVersion: "v3" }],
          members: [
            {
              id: "a",
              name: "A",
              group: "Loan",
              board: "L2",
              spTotal: 4,
              wpTotal: 6,
              workingDays: 1,
            },
            {
              id: "b",
              name: "B",
              group: "Loan",
              board: "L2",
              spTotal: 2,
              wpTotal: 3,
              workingDays: 1,
            },
          ],
        },
  loadBugCount: async (month, group) => {
    bugCalls.push(`${month}:${group}`);
    if (month === "2026-01" && group === "User")
      throw new Error("Jira unavailable");
    return 2;
  },
};

async function main() {
  const result = await generateProductivitySummaryRange(
    {
      months: ["2025-12", "2026-01"],
      selectedGroups: ["Loan", "User"],
      metricBasis: "WP",
      callerName: "A",
    },
    ports,
  );
  assert.equal(result.metricBasis, "SP");
  assert.equal(result.coverage.complete, false);
  assert.equal(
    result.coverage.months[1].failures[0].reason,
    "Jira unavailable",
  );
  assert.equal(
    result.chart[1].bugsRaised,
    2,
    "successful group totals survive a partial bug fanout",
  );
  assert.equal(result.chart[0].productivityPercent, 100);
  assert.deepEqual(bugCalls, [
    "2025-12:Loan",
    "2025-12:User",
    "2026-01:Loan",
    "2026-01:User",
  ]);
  assert.equal(
    result.summary.activeMembers,
    2,
    "aggregate before caller filter",
  );
  assert.deepEqual(
    result.details.map((member) => member.name),
    ["A"],
  );
  assert.deepEqual(result.details[0].boards, ["L1", "L2"]);

  const multiBoard = await generateProductivitySummaryRange(
    { months: ["2026-01"], selectedGroups: ["Loan"], metricBasis: "SP" },
    {
      loadMonth: async () => ({
        source: "live", appliedRules: [], members: [
          { id: "dev@example.com", name: "Dev", group: "Loan", board: "L1", spTotal: 3, wpTotal: 2, workingDays: 10 },
          { id: "dev@example.com", name: "Dev", group: "Loan", board: "L2", spTotal: 5, wpTotal: 4, workingDays: 10 },
        ],
      }),
      loadBugCount: async () => 0,
    },
  );
  assert.deepEqual(multiBoard.details[0].boards, ["L1", "L2"]);
  assert.equal(multiBoard.details[0].monthly.length, 1);
  assert.equal(multiBoard.details[0].monthly[0].spTotal, 8);

  const failed = await generateProductivitySummaryRange(
    { months: ["2026-02"], selectedGroups: ["Loan"], metricBasis: "WP" },
    {
      loadMonth: async () => {
        throw new Error("board failed");
      },
      loadBugCount: async () => 0,
    },
  );
  assert.equal(failed.coverage.months[0].source, "unavailable");
  assert.equal(
    failed.chart[0].productivityMetric,
    null,
    "failed productivity never becomes zero",
  );

  const liveWp = await generateProductivitySummaryRange(
    { months: ["2026-03"], selectedGroups: ["Loan"], metricBasis: "WP" },
    {
      loadMonth: async () => ({
        source: "live", members: [{ id: "a", name: "A", group: "Loan", board: "L1", spTotal: 2, wpTotal: 5, workingDays: 1 }], appliedRules: [],
      }),
      loadBugCount: async () => 1,
    },
  );
  assert.equal(liveWp.metricBasis, "WP");
  assert.equal(liveWp.chart[0].productivityMetric, 5);

  const liveSp = await generateProductivitySummaryRange(
    { months: ["2026-03"], selectedGroups: ["Loan"], metricBasis: "SP" },
    {
      loadMonth: async () => ({
        source: "live", members: [{ id: "a", name: "A", group: "Loan", board: "L1", spTotal: 2, wpTotal: 5, workingDays: 1 }], appliedRules: [],
      }),
      loadBugCount: async () => 1,
    },
  );
  assert.equal(liveSp.metricBasis, "SP");
  assert.equal(liveSp.chart[0].productivityMetric, 2);

  const partial = await generateProductivitySummaryRange(
    { months: ["2026-04"], selectedGroups: ["User"], metricBasis: "SP" },
    {
      loadMonth: async () => ({
        source: "partial",
        availability: { productivity: true },
        failures: [{ scope: "productivity", group: "User", reason: "one board unavailable" }],
        members: [{ id: "u", name: "U", group: "User", board: "U1", spTotal: 3, wpTotal: null, workingDays: 1 }],
        appliedRules: [],
      }),
      loadBugCount: async () => 0,
    },
  );
  assert.equal(partial.coverage.months[0].source, "partial");
  assert.equal(partial.coverage.months[0].productivityAvailable, true);
  assert.equal(partial.chart[0].productivityMetric, 3);
  assert.equal(partial.coverage.months[0].failures[0].reason, "one board unavailable");

  const archivePartial = await generateProductivitySummaryRange(
    { months: ["2025-11"], selectedGroups: ["Loan"], metricBasis: "WP" },
    {
      loadMonth: async () => ({
        source: "partial", archiveBacked: true,
        members: [{ id: "a", name: "A", group: "Loan", board: "L1", spTotal: 7, wpTotal: null, workingDays: 1 }],
        appliedRules: [],
      }),
      loadBugCount: async () => 0,
    },
  );
  assert.equal(archivePartial.metricBasis, "SP");
  assert.equal(archivePartial.coverage.complete, false);
  assert.equal(archivePartial.chart[0].productivityMetric, 7);

  const unavailable = await generateProductivitySummaryRange(
    { months: ["2026-05"], selectedGroups: ["User"], metricBasis: "WP" },
    {
      loadMonth: async () => ({
        source: "unavailable",
        members: [{ id: "must-not-leak", name: "Hidden", group: "User", board: "U1", spTotal: 9, wpTotal: 9, workingDays: 1 }],
        appliedRules: [],
      }),
      loadBugCount: async () => 0,
    },
  );
  assert.equal(unavailable.coverage.complete, false);
  assert.equal(unavailable.chart[0].activeMembers, null);
  assert.equal(unavailable.chart[0].productivityMetric, null);
  assert.deepEqual(unavailable.details, []);

  console.log("productivity-summary-range.service self-check: PASS");
}

void main();
