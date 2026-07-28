-- SLS-17150 forward migration. USER-RUN ONLY.
-- Do not run from Codex, CI, application startup, or an import job.
-- Review apps/tere-project/docs/database/SLS-17150-db-impact-report.md first.

BEGIN;

CREATE TABLE "reporting_group_config" (
  "code" text PRIMARY KEY,
  "display_name" text NOT NULL,
  "reporting_lead_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reporting_group_config_code_supported"
    CHECK ("code" IN ('Loan', 'Transaction', 'User')),
  CONSTRAINT "reporting_group_config_lead_email_fkey"
    FOREIGN KEY ("reporting_lead_email") REFERENCES "members"("email") ON DELETE SET NULL
);

ALTER TABLE "boards"
  ADD COLUMN "reporting_group" text,
  ADD COLUMN "reporting_board_lead_email" text;
--> statement-breakpoint
ALTER TABLE "boards"
  ADD CONSTRAINT "boards_reporting_group_fkey"
  FOREIGN KEY ("reporting_group") REFERENCES "reporting_group_config"("code") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "boards"
  ADD CONSTRAINT "boards_reporting_board_lead_email_fkey"
  FOREIGN KEY ("reporting_board_lead_email") REFERENCES "members"("email") ON DELETE SET NULL;

-- NULL is the explicit persisted representation of Ungrouped. The migration never
-- guesses a business Group from board names or existing bug-monitoring attributes.
UPDATE "boards"
SET "reporting_group" = NULL,
    "reporting_board_lead_email" = NULL
WHERE "is_bug_monitoring" = false;

CREATE TABLE "group_rule_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporting_group" text NOT NULL,
  "effective_month" date NOT NULL,
  "rule_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "group_rule_config_group_fkey"
    FOREIGN KEY ("reporting_group") REFERENCES "reporting_group_config"("code") ON DELETE RESTRICT,
  CONSTRAINT "group_rule_config_effective_month_first_day"
    CHECK ("effective_month" = date_trunc('month', "effective_month")::date),
  CONSTRAINT "group_rule_config_version_supported"
    CHECK ("rule_version" IN ('legacy', 'new', 'v3')),
  CONSTRAINT "group_rule_config_group_effective_month_unique"
    UNIQUE ("reporting_group", "effective_month")
);
--> statement-breakpoint
CREATE INDEX "group_rule_config_lookup_idx"
  ON "group_rule_config" ("reporting_group", "effective_month" DESC);

CREATE TABLE "productivity_archive_import_batch" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target_month" date NOT NULL,
  "source_format" text NOT NULL,
  "status" text NOT NULL,
  "source_file_name" text,
  "source_file_sha256" text,
  "raw_source" jsonb,
  "normalized_summary" jsonb,
  "rejection_reasons" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "validated_at" timestamp with time zone,
  "created_by" text,
  CONSTRAINT "productivity_archive_import_batch_target_month_first_day"
    CHECK ("target_month" = date_trunc('month', "target_month")::date),
  CONSTRAINT "productivity_archive_import_batch_source_format_supported"
    CHECK ("source_format" IN ('green-2025', 'blue-2026')),
  CONSTRAINT "productivity_archive_import_batch_status_supported"
    CHECK ("status" IN ('pending', 'validated', 'rejected')),
  CONSTRAINT "productivity_archive_import_batch_id_target_month_unique"
    UNIQUE ("id", "target_month")
);
--> statement-breakpoint
CREATE INDEX "productivity_archive_import_batch_month_status_idx"
  ON "productivity_archive_import_batch" ("target_month", "status");

CREATE TABLE "productivity_archive_developer_sprint" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "import_batch_id" uuid NOT NULL,
  "archived_month" date NOT NULL,
  "sprint_id" text NOT NULL,
  "sprint_name" text NOT NULL,
  "sprint_start_date" date NOT NULL,
  "sprint_end_date" date NOT NULL,
  "board_id_snapshot" integer,
  "board_name_snapshot" text,
  "reporting_group_snapshot" text,
  "developer_identity_raw" text NOT NULL,
  "developer_identity_normalized" text NOT NULL,
  "developer_level_raw" text,
  "developer_level_normalized" text,
  "main_role_raw" text,
  "main_role_normalized" text,
  "source_team" text,
  "source_format" text NOT NULL,
  "source_status" text,
  "sp_total" numeric,
  "sp_completed" numeric,
  "sp_provenance" text,
  "raw_record" jsonb NOT NULL,
  "normalized_record" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "productivity_archive_developer_sprint_batch_month_fkey"
    FOREIGN KEY ("import_batch_id", "archived_month")
    REFERENCES "productivity_archive_import_batch"("id", "target_month") ON DELETE RESTRICT,
  CONSTRAINT "productivity_archive_developer_sprint_month_first_day"
    CHECK ("archived_month" = date_trunc('month', "archived_month")::date),
  CONSTRAINT "productivity_archive_developer_sprint_month_matches_end"
    CHECK ("archived_month" = date_trunc('month', "sprint_end_date")::date),
  CONSTRAINT "productivity_archive_developer_sprint_dates_ordered"
    CHECK ("sprint_end_date" >= "sprint_start_date"),
  CONSTRAINT "productivity_archive_developer_sprint_group_supported"
    CHECK ("reporting_group_snapshot" IS NULL OR "reporting_group_snapshot" IN ('Loan', 'Transaction', 'User')),
  CONSTRAINT "productivity_archive_developer_sprint_source_format_supported"
    CHECK ("source_format" IN ('green-2025', 'blue-2026')),
  CONSTRAINT "productivity_archive_developer_sprint_sp_nonnegative"
    CHECK (("sp_total" IS NULL OR "sp_total" >= 0) AND ("sp_completed" IS NULL OR "sp_completed" >= 0)),
  CONSTRAINT "productivity_archive_developer_sprint_developer_sprint_start_unique"
    UNIQUE ("archived_month", "developer_identity_normalized", "sprint_id", "sprint_start_date")
);
--> statement-breakpoint
CREATE INDEX "productivity_archive_developer_sprint_month_group_idx"
  ON "productivity_archive_developer_sprint" ("archived_month", "reporting_group_snapshot");

CREATE TABLE "productivity_archive_coverage" (
  "archived_month" date PRIMARY KEY NOT NULL,
  "import_batch_id" uuid NOT NULL UNIQUE,
  "row_count" integer NOT NULL,
  "covered_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "productivity_archive_coverage_batch_month_fkey"
    FOREIGN KEY ("import_batch_id", "archived_month")
    REFERENCES "productivity_archive_import_batch"("id", "target_month") ON DELETE RESTRICT,
  CONSTRAINT "productivity_archive_coverage_month_first_day"
    CHECK ("archived_month" = date_trunc('month', "archived_month")::date),
  CONSTRAINT "productivity_archive_coverage_row_count_nonempty"
    CHECK ("row_count" > 0)
);

INSERT INTO "reporting_group_config" ("code", "display_name")
VALUES
  ('Loan', 'Loan'),
  ('Transaction', 'Transaction'),
  ('User', 'User');
--> statement-breakpoint
INSERT INTO "group_rule_config" ("reporting_group", "effective_month", "rule_version")
VALUES
  ('Loan', '2026-05-01', 'v3'),
  ('Transaction', '2026-05-01', 'v3'),
  ('User', '2026-04-01', 'v3');

COMMIT;
