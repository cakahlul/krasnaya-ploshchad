-- SLS-17150 rollback. USER-RUN ONLY.
-- Prerequisites are mandatory: deployed application no longer routes archive reads,
-- all SLS-17150 import/coverage data has been assessed, and preservation/export has
-- been approved where any validated archive exists.

BEGIN;

DO $rollback$
BEGIN
  IF EXISTS (SELECT 1 FROM "productivity_archive_coverage") THEN
    RAISE EXCEPTION 'SLS-17150 rollback blocked: coverage rows exist; preserve/export decision required';
  END IF;

  IF EXISTS (SELECT 1 FROM "productivity_archive_developer_sprint") THEN
    RAISE EXCEPTION 'SLS-17150 rollback blocked: archive rows exist; never delete approved historical data automatically';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "productivity_archive_import_batch"
    WHERE "status" = 'validated'
  ) THEN
    RAISE EXCEPTION 'SLS-17150 rollback blocked: validated import batch exists; preservation/export decision required';
  END IF;
END
$rollback$;

-- Only untrusted pending/rejected batches can remain after the guards above.
DELETE FROM "productivity_archive_import_batch";

DROP TABLE "productivity_archive_coverage";
DROP TABLE "productivity_archive_developer_sprint";
DROP TABLE "productivity_archive_import_batch";
DROP TABLE "group_rule_config";

ALTER TABLE "boards"
  DROP CONSTRAINT "boards_reporting_board_lead_email_fkey",
  DROP CONSTRAINT "boards_reporting_group_fkey",
  DROP COLUMN "bug_jql",
  DROP COLUMN "reporting_board_lead_email",
  DROP COLUMN "reporting_group";

DROP TABLE "reporting_group_config";

COMMIT;
