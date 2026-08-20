CREATE TABLE "team_reporting_snapshot" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_id" integer NOT NULL,
  "board_name" text NOT NULL,
  "period_kind" text NOT NULL,
  "sprint_id" text,
  "sprint_name" text,
  "period_start_date" date NOT NULL,
  "period_end_date" date NOT NULL,
  "reporting_month" date NOT NULL,
  "raw_jira_input" jsonb NOT NULL,
  "calculated_output" jsonb NOT NULL,
  "raw_input_count" integer NOT NULL,
  "calculated_output_count" integer NOT NULL,
  "raw_input_checksum" text NOT NULL,
  "calculated_output_checksum" text NOT NULL,
  "integrity_evidence" jsonb NOT NULL,
  "required_segment_count" integer NOT NULL,
  "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "team_reporting_snapshot_board_fkey"
    FOREIGN KEY ("board_id") REFERENCES "boards"("board_id") ON DELETE RESTRICT,
  CONSTRAINT "team_reporting_snapshot_period_kind_supported"
    CHECK ("period_kind" IN ('scrum', 'kanban')),
  CONSTRAINT "team_reporting_snapshot_period_identity_valid"
    CHECK (("period_kind" = 'scrum' AND "sprint_id" IS NOT NULL AND btrim("sprint_id") <> '')
      OR ("period_kind" = 'kanban' AND "sprint_id" IS NULL AND "sprint_name" IS NULL)),
  CONSTRAINT "team_reporting_snapshot_dates_ordered"
    CHECK ("period_end_date" >= "period_start_date"),
  CONSTRAINT "team_reporting_snapshot_reporting_month_matches_period_end"
    CHECK ("reporting_month" = date_trunc('month', "period_end_date")::date),
  CONSTRAINT "team_reporting_snapshot_counts_nonnegative"
    CHECK ("raw_input_count" >= 0 AND "calculated_output_count" >= 0 AND "required_segment_count" > 0),
  CONSTRAINT "team_reporting_snapshot_checksums_nonblank"
    CHECK (btrim("raw_input_checksum") <> '' AND btrim("calculated_output_checksum") <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "team_reporting_snapshot_board_sprint_unique"
  ON "team_reporting_snapshot" ("board_id", "sprint_id")
  WHERE "period_kind" = 'scrum';
--> statement-breakpoint
CREATE UNIQUE INDEX "team_reporting_snapshot_board_period_unique"
  ON "team_reporting_snapshot" ("board_id", "period_start_date", "period_end_date")
  WHERE "period_kind" = 'kanban';
--> statement-breakpoint
CREATE TABLE "team_reporting_snapshot_coverage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "snapshot_id" uuid NOT NULL,
  "segment_key" text NOT NULL,
  "raw_input_count" integer NOT NULL,
  "calculated_output_count" integer NOT NULL,
  "checksum" text NOT NULL,
  CONSTRAINT "team_reporting_snapshot_coverage_snapshot_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "team_reporting_snapshot"("id") ON DELETE CASCADE,
  CONSTRAINT "team_reporting_snapshot_coverage_segment_unique" UNIQUE ("snapshot_id", "segment_key"),
  CONSTRAINT "team_reporting_snapshot_coverage_counts_nonnegative"
    CHECK ("raw_input_count" >= 0 AND "calculated_output_count" >= 0),
  CONSTRAINT "team_reporting_snapshot_coverage_checksum_nonblank" CHECK (btrim("checksum") <> '')
);
