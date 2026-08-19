ALTER TABLE "team_reporting_capture_run"
  ADD COLUMN "failure_detail" text;
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_run"
  ADD CONSTRAINT "team_reporting_capture_run_failure_detail_length"
  CHECK ("failure_detail" IS NULL OR char_length("failure_detail") <= 1000);
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_failure"
  ADD COLUMN "stage" text DEFAULT 'unknown' NOT NULL;
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_failure"
  ADD COLUMN "detail" text;
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_failure"
  ADD CONSTRAINT "team_reporting_capture_failure_stage_supported"
  CHECK ("stage" IN ('discovery', 'enumeration', 'validation', 'fetch', 'calculate', 'publish', 'unknown'));
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_failure"
  ADD CONSTRAINT "team_reporting_capture_failure_detail_length"
  CHECK ("detail" IS NULL OR char_length("detail") <= 1000);
