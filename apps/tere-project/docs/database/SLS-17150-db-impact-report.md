# SLS-17150 database impact report

Status: **DB integration UNVERIFIED**. These are static, user-run artifacts only. No database connection, migration, seed, import, rollback, or query execution occurred while preparing this report.

## Changed objects

| Object | Change | Purpose |
| --- | --- | --- |
| `boards` | nullable `reporting_group`, `reporting_board_lead_email`, two FKs | current live reporting Group plus distinct Board Lead; `NULL` Group means `Ungrouped` |
| `reporting_group_config` | new configuration table | supported Groups and optional Group Head in `reporting_lead_email`; separate from Board Lead |
| `group_rule_config` + `group_rule_config_lookup_idx` | new effective-dated rule table and `(reporting_group, effective_month DESC)` index | latest Group rule lookup at a report month |
| `productivity_archive_import_batch` + month/status index | new import audit table | source, normalized summary, validation/rejection evidence |
| `productivity_archive_developer_sprint` + month/Group index | new immutable developer×sprint archive table | historical board/Group snapshots and SP provenance |
| `productivity_archive_coverage` | new coverage/watermark table | non-empty, validated closed-month availability |

## Forward execution order and transaction boundary

1. Read this report and `SLS-17150-seed-plan.md`; collect approved board/Lead/rule inputs.
2. Run read-only preflight queries below. Resolve any unexpected constraints before proceeding.
3. Run `drizzle/0009_reporting_group_and_archive.sql` once in a controlled maintenance window. It is one transaction; DDL, nullable board-column backfill, and deterministic Group/v3 seeds commit together or roll back together.
4. Run the separately reviewed, operator-owned board/Lead and historical legacy/new rule updates in their own transaction.
5. Run post-verification queries, including plan checks. Do not enable Group/archive routing until results are reviewed.

## Lock, scan, write, and duration expectations

`CREATE TABLE` and empty-table indexes are short metadata operations. `ALTER TABLE boards ADD COLUMN` and `ADD CONSTRAINT` acquire an `ACCESS EXCLUSIVE` lock on `boards`; foreign-key validation can scan `boards` and referenced keys. The explicit board update writes each non-bug board, even where values are already null; expected volume is the current non-bug board count. New archive tables are empty, so their indexes have no initial table scan. Actual durations depend on production table size, lock contention, and the execution environment; record user-observed duration and lock waits.

## Backward compatibility

All new `boards` columns are nullable; deployed application versions that do not read them continue to operate. `boards.reporting_board_lead_email` means Board Lead only; Group Head remains `reporting_group_config.reporting_lead_email`. Existing bug-monitoring fields are unchanged. No existing row is assigned a guessed Group or Lead. New archive/config tables are additive and unused until later application work enables them. Application writers must invalidate `BoardsService`'s existing `all_boards` cache after board reporting-configuration mutation; archive reads must never depend on that cache.

## Preflight verification queries — user-run only

```sql
SELECT COUNT(*) AS board_count,
       COUNT(*) FILTER (WHERE is_bug_monitoring = false) AS non_bug_board_count
FROM boards;

SELECT board_id, name, short_name, is_bug_monitoring, bug_issue_type
FROM boards
ORDER BY board_id;

SELECT email, full_name, is_lead
FROM members
ORDER BY email;

SELECT effective_date, COUNT(*)
FROM wp_weight_config
GROUP BY effective_date
HAVING COUNT(*) > 1;
```

## Post-forward verification queries — user-run only

```sql
SELECT code, display_name, reporting_lead_email
FROM reporting_group_config
ORDER BY code;

SELECT reporting_group, effective_month, rule_version
FROM group_rule_config
ORDER BY reporting_group, effective_month;

SELECT board_id, name, reporting_group, reporting_board_lead_email, is_bug_monitoring
FROM boards
ORDER BY board_id;

SELECT archived_month, import_batch_id, row_count, covered_at
FROM productivity_archive_coverage
ORDER BY archived_month;

SELECT target_month, status, COUNT(*)
FROM productivity_archive_import_batch
GROUP BY target_month, status
ORDER BY target_month, status;

SELECT archived_month, reporting_group_snapshot, COUNT(*)
FROM productivity_archive_developer_sprint
GROUP BY archived_month, reporting_group_snapshot
ORDER BY archived_month, reporting_group_snapshot;
```

Expected immediately after this migration: exactly three Group rows; exactly three v3 cutover rows; no archive batches, archive rows, or coverage rows. Board Group and Lead values remain intentionally null until operator-owned approved mapping is applied.

Composite foreign keys enforce period ownership: each developer-sprint row and coverage row must reference the same `(import_batch_id, archived_month)` as its batch `(id, target_month)`. A batch cannot accidentally cover or contain rows for another month.

## Query-plan/index checks — user-run only

Use production-safe representative parameters after data exists; record `EXPLAIN (ANALYZE, BUFFERS)` output only if the operator approves execution.

```sql
EXPLAIN (COSTS, VERBOSE)
SELECT rule_version
FROM group_rule_config
WHERE reporting_group = 'Loan'
  AND effective_month <= DATE '2026-06-01'
ORDER BY effective_month DESC
LIMIT 1;

EXPLAIN (COSTS, VERBOSE)
SELECT *
FROM productivity_archive_developer_sprint
WHERE archived_month = DATE '2026-06-01'
  AND reporting_group_snapshot = 'Loan';
```

## Monitoring and stop conditions

Monitor migration completion/error logs, `boards` lock wait duration, transaction duration, post-query row counts, foreign-key/constraint errors, and application error rate for board reads. Stop before enabling downstream routing if any statement errors, lock wait exceeds the approved maintenance-window threshold, board counts differ unexpectedly, Group/rule seed counts differ, archive counts are nonzero before a validated import, or query plans do not use the expected selective path at production scale. No p95 or API-success claim is valid without operator evidence.

## Rollback conditions and order

Rollback only when the deployed application has first stopped reading archive/configuration objects and an impact review confirms no historical archive data needs retention.

1. Disable/archive-read routing behind application compatibility controls.
2. Export/preserve approved historical archive data if any exists.
3. Confirm coverage and archive row counts are zero, and no validated batch remains.
4. Run `SLS-17150-rollback.sql` once. Its guards abort instead of automatically deleting approved historical data.
5. Re-run the object/count queries; confirm the new tables and board columns are gone only after application compatibility is verified.
