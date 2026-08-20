CREATE TABLE "team_reporting_capture_snapshot_audit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "snapshot_id" uuid NOT NULL,
  "previous_raw_input_checksum" text NOT NULL,
  "next_raw_input_checksum" text NOT NULL,
  "previous_calculated_output_checksum" text NOT NULL,
  "next_calculated_output_checksum" text NOT NULL,
  "added_jira_keys" jsonb NOT NULL,
  "removed_jira_keys" jsonb NOT NULL,
  "changed_jira_keys" jsonb NOT NULL,
  "calculated_paths" jsonb NOT NULL,
  "summary" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "team_reporting_capture_snapshot_audit_run_fkey"
    FOREIGN KEY ("run_id") REFERENCES "team_reporting_capture_run"("id") ON DELETE RESTRICT,
  CONSTRAINT "team_reporting_capture_snapshot_audit_snapshot_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "team_reporting_snapshot"("id") ON DELETE RESTRICT,
  CONSTRAINT "team_reporting_capture_snapshot_audit_run_snapshot_unique" UNIQUE ("run_id", "snapshot_id"),
  CONSTRAINT "team_reporting_capture_snapshot_audit_checksums_valid" CHECK ("previous_raw_input_checksum" ~ '^[a-f0-9]{64}$'
    AND "next_raw_input_checksum" ~ '^[a-f0-9]{64}$'
    AND "previous_calculated_output_checksum" ~ '^[a-f0-9]{64}$'
    AND "next_calculated_output_checksum" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "team_reporting_capture_snapshot_audit_json_shapes" CHECK (jsonb_typeof("added_jira_keys") = 'array'
    AND jsonb_typeof("removed_jira_keys") = 'array'
    AND jsonb_typeof("changed_jira_keys") = 'array'
    AND jsonb_typeof("calculated_paths") = 'array'
    AND jsonb_typeof("summary") = 'object'),
  CONSTRAINT "team_reporting_capture_snapshot_audit_json_bounded" CHECK (octet_length("added_jira_keys"::text) <= 65536
    AND octet_length("removed_jira_keys"::text) <= 65536
    AND octet_length("changed_jira_keys"::text) <= 65536
    AND octet_length("calculated_paths"::text) <= 65536
    AND octet_length("summary"::text) <= 65536)
);
--> statement-breakpoint
CREATE INDEX "team_reporting_capture_snapshot_audit_snapshot_idx"
  ON "team_reporting_capture_snapshot_audit" ("snapshot_id");
