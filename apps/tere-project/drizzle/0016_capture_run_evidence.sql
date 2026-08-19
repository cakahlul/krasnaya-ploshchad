CREATE TABLE "team_reporting_capture_run" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor" text NOT NULL,
  "window_start_date" date NOT NULL,
  "window_end_date" date NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "status" text NOT NULL,
  "attempted_count" integer DEFAULT 0 NOT NULL,
  "succeeded_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "unchanged_count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "team_reporting_capture_run_actor_valid" CHECK (btrim("actor") <> '' AND char_length("actor") <= 160),
  CONSTRAINT "team_reporting_capture_run_window_ordered" CHECK ("window_end_date" >= "window_start_date"),
  CONSTRAINT "team_reporting_capture_run_status_supported" CHECK ("status" IN ('running', 'complete', 'partial', 'failed')),
  CONSTRAINT "team_reporting_capture_run_counts_nonnegative" CHECK ("attempted_count" >= 0 AND "succeeded_count" >= 0 AND "failed_count" >= 0 AND "unchanged_count" >= 0),
  CONSTRAINT "team_reporting_capture_run_terminal_consistent" CHECK (("status" = 'running' AND "completed_at" IS NULL)
    OR ("status" IN ('complete', 'partial', 'failed') AND "completed_at" IS NOT NULL
      AND "succeeded_count" + "failed_count" + "unchanged_count" = "attempted_count")),
  CONSTRAINT "team_reporting_capture_run_complete_without_failures" CHECK ("status" <> 'complete' OR "failed_count" = 0)
);
--> statement-breakpoint
CREATE TABLE "team_reporting_capture_failure" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "board_id" integer NOT NULL,
  "period_key" text NOT NULL,
  "reason" text NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "team_reporting_capture_failure_run_fkey"
    FOREIGN KEY ("run_id") REFERENCES "team_reporting_capture_run"("id") ON DELETE CASCADE,
  CONSTRAINT "team_reporting_capture_failure_board_fkey"
    FOREIGN KEY ("board_id") REFERENCES "boards"("board_id") ON DELETE RESTRICT,
  CONSTRAINT "team_reporting_capture_failure_period_valid" CHECK (btrim("period_key") <> '' AND char_length("period_key") <= 160),
  CONSTRAINT "team_reporting_capture_failure_reason_safe" CHECK ("reason" ~ '^CAPTURE_[A-Z_]{1,96}$')
);
--> statement-breakpoint
CREATE INDEX "team_reporting_capture_failure_run_idx" ON "team_reporting_capture_failure" ("run_id");
