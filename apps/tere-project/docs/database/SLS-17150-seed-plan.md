# SLS-17150 seed plan — user-run only

Database status: **UNVERIFIED**. Codex did not connect to, inspect, migrate, seed, import, or otherwise execute against a database.

## Forward migration seeds

`drizzle/0009_reporting_group_and_archive.sql` creates these deterministic seeds:

| Object | Seed |
| --- | --- |
| `reporting_group_config` | `Loan`, `Transaction`, `User`, initially with no reporting Lead |
| `group_rule_config` | Loan `v3` from `2026-05-01`; Transaction `v3` from `2026-05-01`; User `v3` from `2026-04-01` |
| boards | `reporting_group = NULL`, `reporting_board_lead_email = NULL` for non-bug boards; `NULL` is explicit `Ungrouped` |
| archive coverage | no rows |

The migration deliberately does not infer board Group, reporting Lead, or pre-v3 rule history from board names, team names, or bug-monitoring fields.

## Operator inputs required before enabling Group routing

1. Obtain approved mapping of every active non-bug `boards.board_id` to `Loan`, `Transaction`, `User`, or explicit `NULL` (`Ungrouped`).
2. Obtain approved `members.email` values for each Board Lead, or leave them `NULL` until board-level ownership is known. Group Head ownership is separate and lives only in `reporting_group_config.reporting_lead_email`.
3. Obtain approved legacy/new chronology for each configured Group before its v3 cutover. Insert only the entries needed to describe that chronology; never invent historical rules.
4. Apply reviewed board and historical-rule updates in a separate, auditable transaction after the forward migration. A Group rule references an existing `reporting_group_config.code`; every `effective_month` must be the first calendar day.
5. Review `SLS-17150-production-config.sql`. Bug sources are Jira projects (`INCL`, `INCF`, `BUZZ`), not necessarily Agile boards; each stores an independent `bug_jql` for later special-case filtering.
6. Verify every active non-bug board has exactly one approved Group or an intentional `NULL`, and every bug project has one Group and a non-empty JQL.

Example operator-owned statement shape (values intentionally omitted):

```sql
UPDATE boards
SET reporting_group = :approved_group_or_null,
    reporting_board_lead_email = :approved_board_lead_email_or_null
WHERE board_id = :approved_board_id
  AND is_bug_monitoring = false;
```

## Archive import seed boundary

Do not seed `productivity_archive_import_batch`, `productivity_archive_developer_sprint`, or `productivity_archive_coverage` with synthetic rows. Only the future validated import service may write them atomically after whole-period validation. Coverage requires a non-empty validated period and must not be marked for planned, partial, or failed input.
