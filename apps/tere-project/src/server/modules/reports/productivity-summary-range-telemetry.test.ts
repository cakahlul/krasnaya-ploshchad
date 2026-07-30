import assert from "node:assert/strict";
import {
  generateProductivitySummaryRange,
  type RangeAggregationPorts,
} from "./productivity-summary-range.service";

// SLS-17306: per-month + range-total duration and source distribution are
// logged (via console.log) without changing the returned response shape.
// Isolated from productivity-summary-range.service.test.ts because that
// file's main() throws on a pre-existing unrelated assertion (spTarget
// baseline bug) before reaching any appended scenario.

function captureLogs(): { lines: string[]; restore: () => void } {
  const original = console.log;
  const lines: string[] = [];
  console.log = (...args: unknown[]) => {
    lines.push(args.join(" "));
  };
  return { lines, restore: () => { console.log = original; } };
}

async function main() {
  const mixedPorts: RangeAggregationPorts = {
    loadMonth: async (month) =>
      month === "2025-12"
        ? {
            source: "archive",
            appliedRules: [],
            members: [{ id: "a", name: "A", group: "Loan", board: "L1", spTotal: 8, wpTotal: null, workingDays: 1 }],
          }
        : {
            source: "live",
            appliedRules: [],
            members: [{ id: "a", name: "A", group: "Loan", board: "L2", spTotal: 4, wpTotal: 6, workingDays: 1 }],
          },
    loadBugCount: async () => 0,
  };

  const capture = captureLogs();
  let mixedResult;
  try {
    mixedResult = await generateProductivitySummaryRange(
      { months: ["2025-12", "2026-01"], selectedGroups: ["Loan"], metricBasis: "WP" },
      mixedPorts,
    );
  } finally {
    capture.restore();
  }
  assert.equal(mixedResult.metricBasis, "SP", "archive presence forces SP (response unchanged)");
  const telemetryLines = capture.lines.filter((line) => line.startsWith("[telemetry]"));
  const monthLines = telemetryLines.filter((line) => line.includes("range month"));
  assert.equal(monthLines.length, 2, "one telemetry line per month");
  assert.match(monthLines[0], /month=2025-12 source=archive/);
  assert.match(monthLines[0], /durationMs=\d+/);
  assert.match(monthLines[1], /month=2026-01 source=live/);
  assert.match(monthLines[1], /durationMs=\d+/);
  const totalLine = telemetryLines.find((line) => line.includes("range total"));
  assert.ok(totalLine, "range-total telemetry line emitted");
  assert.match(totalLine!, /durationMs=\d+/);
  assert.match(totalLine!, /monthCount=2/);
  assert.match(totalLine!, /distribution=\{"archive":1,"live":1,"partial":0,"unavailable":0\}/);

  // Fully archived set.
  const archivedCapture = captureLogs();
  let archivedResult;
  try {
    archivedResult = await generateProductivitySummaryRange(
      { months: ["2025-10", "2025-11"], selectedGroups: ["Loan"], metricBasis: "WP" },
      {
        loadMonth: async () => ({
          source: "archive",
          appliedRules: [],
          members: [{ id: "a", name: "A", group: "Loan", board: "L1", spTotal: 5, wpTotal: null, workingDays: 1 }],
        }),
        loadBugCount: async () => 0,
      },
    );
  } finally {
    archivedCapture.restore();
  }
  assert.equal(archivedResult.metricBasis, "SP");
  const archivedTelemetry = archivedCapture.lines.filter((line) => line.startsWith("[telemetry]"));
  const archivedMonthLines = archivedTelemetry.filter((line) => line.includes("range month"));
  assert.equal(archivedMonthLines.length, 2, "one telemetry line per month for fully archived set");
  assert.ok(archivedMonthLines.every((line) => /source=archive/.test(line)), "every month reports source=archive");
  const archivedTotalLine = archivedTelemetry.find((line) => line.includes("range total"));
  assert.ok(archivedTotalLine, "range-total telemetry line emitted for fully archived set");
  assert.match(archivedTotalLine!, /distribution=\{"archive":2,"live":0,"partial":0,"unavailable":0\}/);

  console.log("productivity-summary-range-telemetry self-check: PASS");
}

void main();
