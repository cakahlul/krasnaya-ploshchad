import assert from "node:assert/strict";
import test from "node:test";
import { generateProductivitySummaryRange } from "./productivity-summary-range.service";

const input = { months: ["2026-01"], selectedGroups: ["Loan"] as const, metricBasis: "SP" as const };
const product = { source: "snapshot" as const, snapshotTimestamp: "2026-01-31T00:00:00.000Z", appliedRules: [], members: [] };

test("keeps valid productivity metadata when Jira bugs fail", async () => {
  const result = await generateProductivitySummaryRange(input, {
    loadMonth: async () => product,
    loadBugRaisedCount: async () => { throw new Error("Jira bug timeout"); },
  });
  assert.equal(result.sourceMetadata.source, "snapshot");
  assert.deepEqual(result.sourceMetadata.attemptedSources, [{ source: "snapshot", detail: null }]);
  assert.equal(result.sourceMetadata.fallback, false);
  assert.equal(result.sourceMetadata.snapshotTimestamp, product.snapshotTimestamp);
  assert.equal(result.bugMetadata.source, "jira");
  assert.equal(result.bugMetadata.coverage.status, "unavailable");
  assert.equal(result.bugMetadata.failure, "Jira bug timeout");
});

test("keeps valid Jira bugs when productivity falls back", async () => {
  const result = await generateProductivitySummaryRange(input, {
    loadMonth: async () => { throw new Error("snapshot rejected"); },
    loadBugRaisedCount: async () => 2,
    loadBugDoneCount: async () => 1,
  });
  assert.equal(result.sourceMetadata.source, "unavailable");
  assert.deepEqual(result.sourceMetadata.attemptedSources, [{ source: "archive", detail: "snapshot rejected" }]);
  assert.equal(result.sourceMetadata.coverage.status, "unavailable");
  assert.equal(result.sourceMetadata.fallback, true);
  assert.equal(result.sourceMetadata.reason, "snapshot rejected");
  assert.equal(result.bugMetadata.coverage.status, "complete");
  assert.equal(result.bugMetadata.failure, null);
});

test("reports both failures independently", async () => {
  const result = await generateProductivitySummaryRange(input, {
    loadMonth: async () => { throw new Error("productivity down"); },
    loadBugRaisedCount: async () => { throw new Error("bugs down"); },
  });
  assert.equal(result.sourceMetadata.reason, "productivity down");
  assert.equal(result.bugMetadata.failure, "bugs down");
  assert.equal(result.coverage.complete, false);
});

test("exposes snapshot timestamp only for productivity metadata", async () => {
  const result = await generateProductivitySummaryRange(input, {
    loadMonth: async () => product,
    loadBugRaisedCount: async () => 1,
    loadBugDoneCount: async () => 1,
  });
  assert.equal(result.sourceMetadata.snapshotTimestamp, product.snapshotTimestamp);
  assert.equal(result.bugMetadata.snapshotTimestamp, null);
});

test("marks a successful live source as fallback when stored attempts were rejected", async () => {
  const result = await generateProductivitySummaryRange(input, {
    loadMonth: async () => ({
      source: "live",
      appliedRules: [],
      members: [],
      attempts: [
        { source: "snapshot", detail: "checksum mismatch" },
        { source: "jira", detail: null },
      ],
    }),
  });
  assert.equal(result.sourceMetadata.source, "jira");
  assert.equal(result.sourceMetadata.fallback, true);
  assert.deepEqual(result.sourceMetadata.attemptedSources, [
    { source: "snapshot", detail: "checksum mismatch" },
    { source: "jira", detail: null },
  ]);
  assert.equal(result.sourceMetadata.warning, "Using Jira after stored source fallback");
});

test("keeps fallback metadata per month and member while direct live stays live", async () => {
  const member = { id: "a", name: "A", group: "Loan" as const, board: "L1", spTotal: 8, wpTotal: 5, workingDays: 1 };
  const result = await generateProductivitySummaryRange(
    { months: ["2026-01", "2026-02"], selectedGroups: ["Loan"], metricBasis: "SP" },
    {
      loadMonth: async month => ({
        source: "live",
        appliedRules: [],
        members: [member],
        attempts: month === "2026-01"
          ? [{ source: "jira", detail: null }]
          : [{ source: "snapshot", detail: "snapshot rejected" }, { source: "jira", detail: null }],
      }),
    },
  );

  assert.deepEqual(result.coverage.months.map(month => ({ source: month.source, fallback: month.fallback })), [
    { source: "live", fallback: false },
    { source: "live", fallback: true },
  ]);
  assert.deepEqual(result.details[0].monthly.map(month => ({ source: month.source, fallback: month.fallback })), [
    { source: "live", fallback: false },
    { source: "live", fallback: true },
  ]);
  assert.equal(result.sourceMetadata.warning, "Using Jira after stored source fallback");
});

test("uses generic warnings when fallback provenance is not aggregate Jira", async () => {
  const mixed = await generateProductivitySummaryRange(
    { months: ["2026-01", "2026-02"], selectedGroups: ["Loan"], metricBasis: "SP" },
    {
      loadMonth: async month => month === "2026-01"
        ? { source: "archive", appliedRules: [], members: [] }
        : {
          source: "live", appliedRules: [], members: [], attempts: [
            { source: "snapshot", detail: "stored source rejected" },
            { source: "jira", detail: null },
          ],
        },
    },
  );
  assert.equal(mixed.sourceMetadata.source, "mixed");
  assert.equal(mixed.sourceMetadata.fallback, true);
  assert.equal(mixed.sourceMetadata.warning, "Source fallback was used");

  const partial = await generateProductivitySummaryRange(input, {
    loadMonth: async () => ({
      source: "partial", appliedRules: [], members: [], failures: [{ scope: "productivity", reason: "coverage gap" }],
    }),
  });
  assert.equal(partial.sourceMetadata.warning, "Report coverage is incomplete");

  const unavailable = await generateProductivitySummaryRange(input, {
    loadMonth: async () => { throw new Error("source unavailable"); },
  });
  assert.equal(unavailable.sourceMetadata.warning, "Report coverage is incomplete");
});

test("keeps empty successful ranges covered without inventing members", async () => {
  const result = await generateProductivitySummaryRange(
    { months: ["2026-01"], selectedGroups: [], metricBasis: "SP" },
    { loadMonth: async () => ({ source: "live", appliedRules: [], members: [] }) },
  );
  assert.equal(result.coverage.complete, true);
  assert.deepEqual(result.sourceMetadata.coverage, { status: "complete", expected: 1, covered: 1 });
  assert.deepEqual(result.bugMetadata.coverage, { status: "complete", expected: 0, covered: 0 });
  assert.equal(result.summary.activeMembers, 0);
  assert.deepEqual(result.details, []);
});
