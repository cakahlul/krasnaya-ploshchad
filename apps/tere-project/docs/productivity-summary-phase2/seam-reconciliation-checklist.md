# Seam Reconciliation Checklist — Archive vs Live, Before Archive Is Trusted for Release

**Ticket**: SLS-17310
**Scope**: Operational checklist only. This document does not run any comparison query,
reconciliation script, or DB read.

## Who executes this

The **operator/user** executes this checklist, and it requires **both** a data owner sign-off and
an approver sign-off before an archived period is trusted for release. The engineer who authored
this checklist does not run it against production and does not sign on the data owner's or
approver's behalf.

## Purpose

Before a given archived period is trusted as the source of truth for release (i.e. before
consumers rely on `source: 'archive'` for that period instead of falling back to `live`), a
signed comparison between the **archive** and the **live** seam must be completed. A discrepancy
found during this comparison **blocks release** of that period as archive-backed, unless a
controlled correction is performed first (see `first-correction-runbook.md`) and this checklist
is re-run to sign off the corrected result.

## Preconditions

- [ ] The archived period under review is identified (`targetMonth` / `archivedMonth`).
- [ ] The archive import for this period has completed (see `first-correction-runbook.md` if this
      is itself a correction pass) and its coverage row exists.
- [ ] A live-seam query for the same period/Groups is available to compare against.
- [ ] Both a data owner and an approver are identified and available to sign this checklist.

## Comparison checklist

For the target period, compare the **archive** result against the **live** result. For each
row below, record match/mismatch — do not average discrepancies away.

- [ ] **Coverage source reported for the period.** Archive side must report `source: 'archive'`.
      Live side must not report `unavailable` for the same period/Groups being compared (if the
      live side itself reports `partial` or `unavailable`, note this explicitly — it limits what
      can be compared, it is not itself proof the archive is correct).
- [ ] **Row/record count** for the period matches between archive and live, per Group being
      compared.
- [ ] **Per-Group productivity figures** (whatever the report's own basis routes to — SP-based or
      working-days-based) match between archive and live for every Group in scope.
- [ ] **Per-Group bug-board figures** match between archive and live (bug-board queries are
      typically live regardless of whether productivity is archive-backed — confirm the live
      bug-board numbers used in both comparisons are drawn from the same query window).
- [ ] **No unexplained `partial` or `unavailable` months** remain in the archive-side coverage for
      the period under review.
- [ ] **No unexplained `failures`** are present in the archive-side coverage for the period.

## Discrepancy handling

- If **any** row above is a mismatch (or a live-side `partial`/`unavailable` prevents a clean
  comparison), this checklist **cannot be signed as RELEASE**. Choose one:
  - **BLOCK** — hold release of this period as archive-backed; period continues to serve from
    `live` (or its existing state) until resolved.
  - **CORRECT** — run `first-correction-runbook.md` for this period, then re-run this checklist
    from the top against the corrected archive data before signing again.
- Do not sign RELEASE with an open, unresolved discrepancy on file.

## Sign-off

Both signatures are required before this period is trusted as archive-backed for release.

```
Target period (targetMonth):
Groups compared:
Comparison run date/time:
Operator (ran the comparison):

Comparison result summary:
  - Coverage source (archive side):
  - Coverage source (live side):
  - Row/record count match? (yes/no, detail if no):
  - Productivity figures match? (yes/no, detail if no):
  - Bug-board figures match? (yes/no, detail if no):
  - Unexplained partial/unavailable months? (list if any):
  - Unexplained failures? (list if any):

Decision: [RELEASE | BLOCK | CORRECT]
  - If CORRECT: reference to first-correction-runbook.md run / importBatchId:
  - If BLOCK: reason held:

Data owner sign-off:
  - Name:
  - Date:
  - Signature/approval reference:

Approver sign-off:
  - Name:
  - Date:
  - Signature/approval reference:
```

## Notes / assumptions

- Vocabulary in this checklist (`archive`, `live`, `partial`, `unavailable`) matches the coverage
  source values used by the productivity-summary range aggregation
  (`apps/tere-project/src/server/modules/reports/productivity-summary-range.service.ts`) — no
  new terms are introduced.
- Do not paste raw developer identities, credentials, or spreadsheet contents into the
  comparison-result fields; record counts, statuses, and reason codes only.
