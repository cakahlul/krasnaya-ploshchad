# SLS-17159 — archive working-days column

User-run in Supabase SQL Editor only. The application does not execute this migration.

## Impact

- Adds one nullable `numeric` column to `productivity_archive_developer_sprint`.
- Existing rows remain valid and keep `NULL` until the archive import is rerun with working-day data.
- Adds a non-negative check constraint; no existing data is deleted or rewritten.
- Re-run the generated archive import package after this migration to populate 2025/2026 working days.

## Rollback

```sql
ALTER TABLE productivity_archive_developer_sprint
  DROP CONSTRAINT IF EXISTS productivity_archive_developer_sprint_working_days_nonnegative;
ALTER TABLE productivity_archive_developer_sprint
  DROP COLUMN IF EXISTS working_days;
```
