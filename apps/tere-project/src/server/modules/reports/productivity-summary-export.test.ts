import assert from "node:assert/strict";
import { buildProductivitySummaryRangeSheet, productivitySummarySheetDimensions } from "./productivity-summary.service";

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
assert.deepEqual(productivitySummarySheetDimensions(sheet.values), { columnCount: 13, frozenRowCount: 5 });
assert.deepEqual(productivitySummarySheetDimensions([
  ['Productivity Summary', 'range'], ['Selected Groups', 'User'], ['Coverage Complete', 'No'],
  ['Source', 'Jira Fallback'], ['Coverage', 'Fallback'], ['Warning', 'Using Jira after stored source fallback'], [],
  ['Month', 'Source', 'Metric Basis', 'Active Members', 'Productivity %', 'SP Total', 'Bugs Raised', 'Bugs Done', 'Source Label', 'Coverage', 'Warning'],
]), { columnCount: 11, frozenRowCount: 8 });
assert.deepEqual(sheet.values[6], ["2026-05", "partial", "SP", 1, "", "", "", "", "Partial", "Partial", "Report coverage is incomplete"]);
assert.deepEqual(sheet.values[9], ["Group", "Boards", "Name", "Month", "Source", "Rule", "Metric Basis", "SP Total", "WP Total", "Working Days", "Source Label", "Coverage", "Warning"]);
assert.deepEqual(sheet.values[10], ["User", "Ambis Mobile, Ambis Web", "Historical Member", "2026-04", "archive", "v3", "SP", 21, "", 18, "Archived", "Complete", ""]);
assert.deepEqual(sheet.values[11], ["User", "Ambis Mobile, Ambis Web", "Historical Member", "2026-05", "partial", "v3", "SP", "", "", 20, "Partial", "Partial", "Report coverage is incomplete"]);
assert.deepEqual(sheet.values.at(-1), ["2026-05", "bugs", "User", "USR Bugs", "Jira timeout"]);

const fallbackSheet = buildProductivitySummaryRangeSheet({
  range: { startMonth: "2026-06", endMonth: "2026-06", monthCount: 1 },
  selectedGroups: ["User"],
  metricBasis: "SP",
  coverage: { complete: true, months: [{ month: "2026-06", source: "live", productivityAvailable: true, bugsAvailable: true, appliedRules: [], failures: [], attempts: [{ source: "snapshot", detail: "rejected" }, { source: "jira", detail: null }], fallback: true }] },
  summary: { activeMembers: 1, productivityMetric: 8, bugsRaised: 0 },
  details: [{ name: "Fallback Member", group: "User", boards: ["SLS"], monthly: [{ month: "2026-06", source: "live", fallback: true, spTotal: 8, wpTotal: 5, workingDays: 2 }] }],
  chart: [{ month: "2026-06", activeMembers: 1, productivityMetric: 8, productivityPercent: 50, bugsRaised: 0, bugsDone: 0, source: "live", fallback: true, metricBasis: "SP" }],
  sourceMetadata: { source: "jira", coverage: { status: "fallback", expected: 1, covered: 1 }, fallback: true, reason: "rejected", warning: "Using Jira after stored source fallback", attemptedSources: [{ source: "snapshot", detail: "rejected" }, { source: "jira", detail: null }], snapshotTimestamp: null },
  bugMetadata: { source: "jira", coverage: { status: "complete", expected: 1, covered: 1 }, failure: null, snapshotTimestamp: null },
});
assert.deepEqual(fallbackSheet.values[8], ["2026-06", "live", "SP", 1, 50, 8, 0, 0, "Jira Fallback", "Fallback", "Using Jira after stored source fallback"]);
assert.deepEqual(fallbackSheet.values[12], ["User", "SLS", "Fallback Member", "2026-06", "live", "", "SP", 8, 5, 2, "Jira Fallback", "Fallback", "Using Jira after stored source fallback"]);

console.log("productivity-summary export contract self-check: PASS");
