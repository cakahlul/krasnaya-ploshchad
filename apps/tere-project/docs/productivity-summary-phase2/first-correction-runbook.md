# First Correction Runbook — Atomic Re-import/Replace of ONE Archived Period

**Ticket**: SLS-17310
**Scope**: Operational runbook only. This document does not run, script, or trigger any
re-import, backfill, or DB write.

## Who executes this

The **operator/user** executes this runbook, with the **data owner's approval captured before
the import runs**. The engineer who authored this runbook does not run this against production
and does not perform the re-import on the operator's behalf.

## What this corrects

A re-import/replace of **exactly one** already-archived month (`archivedMonth` / `targetMonth`),
using the existing import seam (`ArchiveImportService.import(parsed, approval)` in
`apps/tere-project/src/server/modules/productivity-archive/archive-import.ts`). The seam is:
- **Transaction-only**: every write (row replace, coverage upsert, watermark advance, evidence
  write) happens inside one `port.transaction(...)` call. There is no partial-write path — a
  period is either fully replaced or not written at all.
- **Content-fingerprint idempotent**: the fingerprint is a stable hash of
  `{ sourceFormat, targetMonth, records }`. Re-submitting the exact same parsed content for the
  same `targetMonth` is detected via `findSuccessfulImport(targetMonth, contentFingerprint)` and
  returns `IDEMPOTENT` with the **existing** `importBatchId` — it does not write a second time.

Do not attempt to re-import more than one archived period in a single pass of this runbook; if
multiple periods need correction, repeat the whole procedure once per period so pre/post row
counts and evidence stay scoped to a single period.

## Preconditions

- [ ] The single archived period to correct is identified (`targetMonth`, e.g. `YYYY-MM`).
- [ ] The data owner has reviewed the corrected source data and is ready to approve — approval is
      a required input to the import call (`dataOwnerApprovedBy`). Without it, the import is
      rejected with reason `DATA_OWNER_APPROVAL_REQUIRED` and nothing is written.
- [ ] The operator has an `operatorId` to attribute the import to.
- [ ] The corrected source file/content for the period is ready.

## Steps

1. **Capture pre-import row count for the target period.** Before submitting the corrected
   source, record the current row count for `targetMonth` (this is what the seam itself will
   also record internally as `previousRowCount`, but capture it independently first so you have
   it even if the import is rejected).
2. **Submit the corrected source for import**, with the data owner's approval attached
   (`dataOwnerApprovedBy` non-empty). The seam validates, in order, before writing anything:
   - Approval present → else rejected `DATA_OWNER_APPROVAL_REQUIRED`.
   - Parse-level rejections (`parsed.rejections`) → else rejected `PARSE_REJECTIONS`.
   - Non-empty record set → else rejected `EMPTY_ARCHIVE_IMPORT`.
   - Every record's `archivedMonth`/`sourceFormat` matches the parsed target's
     `targetMonth`/`sourceFormat` → else rejected `RECORD_CONTRACT_MISMATCH`.
   Each rejection path writes rejection evidence (see "Rejected rows with reasons" below) and
   performs **no** row replace, coverage upsert, or watermark advance.
3. **If accepted**, the seam computes the content fingerprint and checks for a prior successful
   import with the same `targetMonth` + fingerprint:
   - If found → result is `IDEMPOTENT` with the **existing** `importBatchId`. This is the
     idempotent-replay path: re-running the identical corrected content a second time (e.g. retry
     after a network blip, or operator re-running by mistake) must return this status, not a new
     batch id and not a duplicate row replace. Record this as your idempotent-replay evidence.
   - If not found → the seam proceeds to write: allocates a new `importBatchId`, records
     `previousRowCount` (rows present for `targetMonth` before this write), replaces the full
     target-period row set (`replaceTargetPeriod`), upserts the coverage row
     (`{archivedMonth, importBatchId, rowCount}`), advances the archive watermark for the period,
     and writes the "imported" evidence record.
4. **Capture the result.** On `IMPORTED`, record `importBatchId` and the
   `reconciliation` block (`targetMonth`, `previousRowCount`, `writtenRowCount`,
   `replacedRowCount`). On `IDEMPOTENT`, record the returned `importBatchId` and note it matches
   the prior successful import for the same fingerprint. On any `REJECTED` status, record the
   `reason` and the written/rejected-rows evidence per the fields below — do not retry blindly;
   resolve the cause (missing approval, parse errors, empty file, or contract mismatch) first.
5. **Verify idempotent replay explicitly.** As a deliberate check (not just an accidental retry),
   re-submit the identical corrected content a second time and confirm the seam again returns
   `IDEMPOTENT` with the same `importBatchId` as step 3/4, and that the row count for
   `targetMonth` is unchanged from after the first successful write. This proves the seam is safe
   to retry without duplicating effect.
6. **Record post-import row count** for `targetMonth` and confirm it matches `writtenRowCount`
   from the reconciliation block.

## Written vs rejected rows, with reasons

This seam performs an **all-or-nothing replace per import attempt** — there is no partial subset
of rows written for one attempt. Record which of the two outcomes occurred and why:

- **Written**: all rows in the corrected source were written for `targetMonth` under one
  `importBatchId`. Reason: import accepted (approval present, no parse rejections, non-empty,
  contract match).
- **Rejected**: none of the rows were written. Reason is exactly one of:
  `DATA_OWNER_APPROVAL_REQUIRED`, `PARSE_REJECTIONS`, `EMPTY_ARCHIVE_IMPORT`,
  `RECORD_CONTRACT_MISMATCH`. If the reason is `PARSE_REJECTIONS` or `RECORD_CONTRACT_MISMATCH`,
  the seam also carries a per-row rejection list (`rowIndex`, `reasons`, `evidence`) — record
  which row indices and reason codes were reported, not the raw row content.

## Evidence-capture template

Fill in every field. Leave a field explicitly marked `N/A` or `NOT CAPTURED` rather than guessing
a value. Do **not** paste credentials, raw developer/user-identifying data, or spreadsheet
contents into this evidence — record identifiers, counts, and reason codes only.

```
Target period (targetMonth):
Operator (operatorId):
Data owner approval (dataOwnerApprovedBy):
Run date/time:

Pre-import row count (independent capture, before submission):

Import attempt #1 result:
  - Status: [IMPORTED | IDEMPOTENT | REJECTED]
  - importBatchId:
  - If REJECTED, reason: [DATA_OWNER_APPROVAL_REQUIRED | PARSE_REJECTIONS | EMPTY_ARCHIVE_IMPORT | RECORD_CONTRACT_MISMATCH]
  - If REJECTED with per-row rejections, row indices + reason codes:

Reconciliation block (if IMPORTED):
  - targetMonth:
  - previousRowCount:
  - writtenRowCount:
  - replacedRowCount:

Content fingerprint idempotent-replay check (step 5):
  - Re-submission #2 status: [IDEMPOTENT expected]
  - importBatchId returned (must match attempt #1's importBatchId if attempt #1 was IMPORTED):
  - Row count after re-submission (must be unchanged from post-attempt-#1):

Post-import row count (independent capture, after the run):
  - Matches writtenRowCount above? (yes/no)

Coverage row confirmed:
  - archivedMonth:
  - importBatchId:
  - rowCount:
```

## Notes / assumptions

- This runbook is grounded directly in the current `ArchiveImportService` behavior read from
  `archive-import.ts` — no re-import path beyond what that service exposes is assumed or
  invented.
- "Rejected rows with reasons" in this seam's current implementation are all-or-nothing at the
  import-attempt level (not per-row partial writes); the per-row detail available is the
  rejection reason list, not a mix of some rows written and others not, within a single attempt.
