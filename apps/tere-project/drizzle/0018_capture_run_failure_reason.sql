ALTER TABLE "team_reporting_capture_run"
  ADD COLUMN "failure_reason" text;
--> statement-breakpoint
ALTER TABLE "team_reporting_capture_run"
  ADD CONSTRAINT "team_reporting_capture_run_failure_reason_safe"
  CHECK ("failure_reason" IS NULL OR "failure_reason" ~ '^CAPTURE_[A-Z_]{1,96}$');
