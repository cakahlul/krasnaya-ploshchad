ALTER TABLE productivity_archive_developer_sprint
  ADD COLUMN IF NOT EXISTS sp_target numeric;

ALTER TABLE productivity_archive_developer_sprint
  ADD CONSTRAINT productivity_archive_developer_sprint_sp_target_nonnegative
  CHECK (sp_target IS NULL OR sp_target >= 0);
