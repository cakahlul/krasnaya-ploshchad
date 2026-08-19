import assert from "node:assert/strict";
import { buildProductivitySummaryRangeSheet } from "./productivity-summary.service";

const sheet = buildProductivitySummaryRangeSheet({
  range: { startMonth: "2026-04", endMonth: "2026-05", monthCount: 2 },
  selectedGroups: ["User"],
  metricBasis: "SP",
  coverage: {
    complete: false,
    months: [
      { month: "2026-04", source: "archive", productivityAvailable: true, bugsAvailable: true, appliedRules: [{ group: "User", ruleVersion: "v3" }], failures: [] },
      { month: "2026-05", source: "partial", productivityAvailable: true, bugsAvailable: false, appliedRules: [{ group: "User", ruleVersion: "v3" }], failures: [{ scope: "bugs", group: "User", board: "USR Bugs", reason: "Jira timeout" }] },
    ],
  },
  summary: { activeMembers: 1, productivityMetric: null, bugsRaised: null },
  details: [{
    name: "Historical Member", group: "User", boards: ["Ambis Web", "Ambis Mobile"],
    monthly: [
      { month: "2026-04", source: "archive", spTotal: 21, wpTotal: null, workingDays: 18 },
      { month: "2026-05", source: "partial", spTotal: null, wpTotal: null, workingDays: 20 },
    ],
  }],
  chart: [
    { month: "2026-04", activeMembers: 1, productivityMetric: 21, productivityPercent: 14.583333, bugsRaised: 2, source: "archive", metricBasis: "SP" },
    { month: "2026-05", activeMembers: 1, productivityMetric: null, bugsRaised: null, source: "partial", metricBasis: "SP" },
  ],
});

assert.equal(sheet.title, "Productivity Summary - 2026-04 to 2026-05");
assert.deepEqual(sheet.values[0], ["Productivity Summary", "2026-04 to 2026-05"]);
// `Bugs Done` joined the chart and the sheet in dc2359d (SLS-17159); the header and every row
// carry it, so a row is eight wide.
assert.deepEqual(sheet.values[4], ["Month", "Source", "Metric Basis", "Active Members", "Productivity %", "SP Total", "Bugs Raised", "Bugs Done", "Source Label", "Coverage", "Warning"]);
assert.equal(sheet.values[5].length, sheet.values[4].length, "every chart row must match the header width");
assert.deepEqual(sheet.values[6], ["2026-05", "partial", "SP", 1, "", "", "", "", "Partial", "Partial", "Report coverage is incomplete"]);
assert.deepEqual(sheet.values[9], ["Group", "Boards", "Name", "Month", "Source", "Rule", "Metric Basis", "SP Total", "WP Total", "Working Days", "Source Label", "Coverage", "Warning"]);
assert.deepEqual(sheet.values[10], ["User", "Ambis Mobile, Ambis Web", "Historical Member", "2026-04", "archive", "v3", "SP", 21, "", 18, "Archived", "Complete", ""]);
assert.deepEqual(sheet.values[11], ["User", "Ambis Mobile, Ambis Web", "Historical Member", "2026-05", "partial", "v3", "SP", "", "", 20, "Partial", "Partial", "Report coverage is incomplete"]);
assert.deepEqual(sheet.values.at(-1), ["2026-05", "bugs", "User", "USR Bugs", "Jira timeout"]);

console.log("productivity-summary export contract self-check: PASS");
