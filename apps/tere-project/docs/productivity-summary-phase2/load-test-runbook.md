# Load Test Runbook — Productivity Summary (Phase 2)

**Ticket**: SLS-17310
**Scope**: Operational runbook only. This document does not run, schedule, or trigger any load test.

## Who executes this

The **operator/user** executes every step in this runbook against a designated test/staging
target. The engineer who authored this runbook does **not** run it against production, and does
not run any load-test tool on the operator's behalf. If an engineer needs a result for
diagnosis, the operator captures the evidence template below and hands it over — the engineer
does not re-run the test themselves against production data.

## Scope of this runbook

Two distinct scenarios, each with its own threshold. Do not average or combine them.

### Scenario A — 12-month fully live range
- Range: 12 consecutive months, all months resolving with `source: 'live'` (no `archive`, no
  `partial`, no `unavailable` months in the range).
- Threshold (quoted from the ticket): **API p95 <= 15s**, **success rate >= 99%**.

### Scenario B — 12-month fully archived COMPLETE report, including live dedicated Group bug-board queries
- Range: 12 consecutive months, all months resolving with `source: 'archive'` (the archived
  productivity data itself), report coverage overall must read as COMPLETE (see "Coverage
  completeness" below).
- Within that same report run, the **dedicated Group bug-board queries stay live** even though
  the productivity rows come from `archive` — these are the queries this scenario's threshold
  applies to.
- Threshold (quoted from the ticket): **live dedicated Group bug-board queries p95 <= 3s**.

## Preconditions

- [ ] Target environment identified (must NOT be production unless the operator has explicit
      authorization and a maintenance/off-peak window).
- [ ] Load-test tool selected and available to the operator (e.g. k6, Artillery, or whatever the
      operator's toolkit already provides — this runbook does not mandate a specific tool).
- [ ] Test data set confirmed as covering the intended 12-month range for the scenario being run.

## Steps — Scenario A (12-month fully live)

1. Select a 12-month `startMonth`/`endMonth` range that is known (from a prior read of the
   report's own `coverage.months[].source`) to resolve entirely as `live` for the environment
   under test.
2. Select the Group(s) to include in the request (record which Groups — see evidence template).
3. Decide concurrency level(s) to run (e.g. a fixed concurrent-user count, or a ramp). Record the
   exact concurrency value(s) used.
4. Fire the request set against `GET /api/report/productivity-summary` for the chosen range,
   Groups, and concurrency.
5. Collect per-request latency (p50, p95), success rate, and any non-2xx responses or timeouts.
6. Confirm every month in the response's `coverage.months[]` reports `source: 'live'` with no
   `partial`/`unavailable` — if any month degrades mid-run, note it; it invalidates a "fully
   live" Scenario A run (re-run once the range is confirmed live, or record the run as
   Scenario-mixed and do not compare it against the Scenario A threshold).
7. Compare p95 against **<= 15s** and success rate against **>= 99%**. Record pass/fail.
8. If a tuning change was made (index, cache, timeout, concurrency limit, etc.) as a result of a
   failing run, repeat steps 1–7 and capture a **before** and **after** evidence record so the
   improvement is comparable.

## Steps — Scenario B (12-month fully archived COMPLETE, live dedicated Group bug-board queries)

1. Select a 12-month range known to resolve entirely as `archive` for the environment under test.
2. Select the Group(s) to include (record which Groups). The Group bug-board queries for these
   Groups are the ones that stay `live` inside this run — that is the surface this scenario
   measures.
3. Decide concurrency level(s). Record the exact value(s) used.
4. Fire the request set for the chosen range and Groups.
5. Collect latency (p50, p95) and success rate **specifically for the live dedicated Group
   bug-board queries** (isolate these from the overall report request timing if your tooling
   reports them separately; if it does not, note that limitation in the evidence record instead
   of guessing a number).
6. Confirm the overall report reads as COMPLETE coverage: every month `source: 'archive'`, no
   `partial`/`unavailable` months, `coverage.months[].failures` empty for all 12 months.
7. Compare the live dedicated Group bug-board query p95 against **<= 3s**. Record pass/fail.
8. If tuned, repeat and capture before/after evidence as in Scenario A step 8.

## Coverage completeness — what "COMPLETE" means here

A report run is COMPLETE for the scenario's purposes only if, across all 12 months in range:
- No month's coverage source is `partial`.
- No month's coverage source is `unavailable`.
- No month has non-empty `failures`.

If any month is `partial` or `unavailable`, or has failures, the run does not qualify as a
COMPLETE report for Scenario B — record it as such rather than reporting a threshold comparison
against an incomplete run.

## Evidence-capture template

Fill in every field. Leave a field explicitly marked `N/A` or `NOT CAPTURED` rather than guessing
a value. Do **not** paste credentials, raw developer/user-identifying data, or spreadsheet
contents into this evidence — record identifiers (Group name, month range, batch/run id) only.

```
Scenario: [A - 12-month fully live | B - 12-month fully archived COMPLETE]
Run date/time:
Environment (must not be production unless authorized):
Operator:

Request set:
  - Endpoint:
  - startMonth / endMonth:
  - Groups selected:
  - metricBasis (if applicable):

Concurrency:
  - Concurrency level(s) used:
  - Ramp profile (if any):

Results:
  - p50 latency:
  - p95 latency:
  - Success rate (%):
  - Non-2xx response count / codes:
  - Timeout count:

Coverage completeness:
  - All 12 months source = live/archive as expected? (yes/no)
  - Any month partial/unavailable? (list months if so)
  - Any month with non-empty failures? (list months if so)

Threshold comparison:
  - Threshold applied: [p95 <= 15s, success >= 99% | live dedicated Group bug-board p95 <= 3s]
  - Pass/Fail:

Tuning (only if a change was made after a failing run):
  - Change description:
  - Before evidence (same fields as above, prior run):
  - After evidence (same fields as above, re-run):
```

## Notes / assumptions

- This runbook does not name a specific load-test tool; the operator uses whatever tool is
  already part of their toolkit, per YAGNI (no new dependency mandated here).
- "Live dedicated Group bug-board queries" refers to the Group bug-board fetches that remain
  live even when the surrounding productivity range is archive-backed, matching the vocabulary
  used by the aggregation service (`source: 'archive' | 'live' | 'partial' | 'unavailable'`).
