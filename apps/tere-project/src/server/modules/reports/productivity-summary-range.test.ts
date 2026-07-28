/**
 * Self-check for productivity-summary request range parsing (SLS-17148).
 * Run: npx tsx src/server/modules/reports/productivity-summary-range.test.ts
 * Pure — no DB/network.
 */
import assert from "node:assert/strict";
import { parseProductivitySummaryRange } from "./productivity-summary-range";

function params(values: Record<string, string | undefined>): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) result.set(key, value);
  }
  return result;
}

function parsed(values: Record<string, string | undefined>) {
  const result = parseProductivitySummaryRange(params(values));
  assert.equal(result.ok, true, result.ok ? undefined : result.message);
  return result.value;
}

function rejected(values: Record<string, string | undefined>, message: string) {
  const result = parseProductivitySummaryRange(params(values));
  assert.deepEqual(result, { ok: false, message });
}

// Legacy stays a one-month request, retaining the exact month/year inputs.
assert.deepEqual(parsed({ month: "2", year: "2024" }), {
  kind: "legacy",
  month: 2,
  year: 2024,
  months: ["2024-02"],
});

// Canonical ranges are inclusive and cross year boundaries correctly.
assert.deepEqual(parsed({ startMonth: "2025-12", endMonth: "2026-02" }), {
  kind: "range",
  startMonth: "2025-12",
  endMonth: "2026-02",
  months: ["2025-12", "2026-01", "2026-02"],
});

assert.deepEqual(parsed({ startMonth: "2024-02", endMonth: "2024-02" }), {
  kind: "range",
  startMonth: "2024-02",
  endMonth: "2024-02",
  months: ["2024-02"],
});

assert.deepEqual(parsed({ startMonth: "2024-02", endMonth: "2024-03" }).months, [
  "2024-02",
  "2024-03",
]);

// Exactly 24 months is allowed; a 25th month is rejected.
assert.equal(
  parsed({ startMonth: "2024-01", endMonth: "2025-12" }).months.length,
  24,
);
rejected(
  { startMonth: "2024-01", endMonth: "2026-01" },
  "range must not exceed 24 months",
);

// Raw forms are exclusive and strict at the boundary.
const leadingZeroLegacy = parsed({ month: "02", year: "2024" });
assert.equal(leadingZeroLegacy.kind, "legacy");
if (leadingZeroLegacy.kind === "legacy")
  assert.equal(leadingZeroLegacy.month, 2);
const invalidCases: Array<[
  Record<string, string | undefined>,
  string,
]> = [
  [{}, "month and year are required"],
  [{ month: "2" }, "month and year are required"],
  [{ year: "2024" }, "month and year are required"],
  [{ month: "0", year: "2024" }, "month must be an integer from 1 to 12"],
  [{ month: "13", year: "2024" }, "month must be an integer from 1 to 12"],
  [{ month: "-1", year: "2024" }, "month must be an integer from 1 to 12"],
  [{ month: "2x", year: "2024" }, "month must be an integer from 1 to 12"],
  [{ month: "2", year: "0000" }, "year must be a four-digit integer"],
  [{ month: "2", year: "2024x" }, "year must be a four-digit integer"],
  [{ startMonth: "2024-01" }, "startMonth and endMonth are required"],
  [{ startMonth: "", endMonth: "2024-01" }, "startMonth and endMonth are required"],
  [{ startMonth: "2024-01", endMonth: "" }, "startMonth and endMonth are required"],
  [{ startMonth: "2024-1", endMonth: "2024-02" }, "startMonth and endMonth must use YYYY-MM"],
  [{ startMonth: "year-01", endMonth: "2024-02" }, "startMonth and endMonth must use YYYY-MM"],
  [{ startMonth: "2024-01", endMonth: "2024-2" }, "startMonth and endMonth must use YYYY-MM"],
  [{ startMonth: "2024-13", endMonth: "2024-12" }, "startMonth and endMonth must use YYYY-MM"],
  [{ startMonth: "0000-01", endMonth: "0000-01" }, "startMonth and endMonth must use YYYY-MM"],
  [{ startMonth: "2024-03", endMonth: "2024-02" }, "startMonth must not be after endMonth"],
  [{ startMonth: "2024-01", endMonth: "2026-01" }, "range must not exceed 24 months"],
  [
    { month: "2", year: "2024", startMonth: "2024-02", endMonth: "2024-02" },
    "legacy and canonical range parameters cannot be mixed",
  ],
];

for (const [values, message] of invalidCases) rejected(values, message);

console.log("productivity-summary-range self-check: PASS");
