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
