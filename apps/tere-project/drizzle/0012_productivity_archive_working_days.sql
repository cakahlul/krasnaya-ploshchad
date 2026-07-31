ALTER TABLE productivity_archive_developer_sprint
  ADD COLUMN IF NOT EXISTS working_days numeric;

ALTER TABLE productivity_archive_developer_sprint
  ADD CONSTRAINT productivity_archive_developer_sprint_working_days_nonnegative
  CHECK (working_days IS NULL OR working_days >= 0);
