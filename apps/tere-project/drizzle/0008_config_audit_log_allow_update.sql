ALTER TABLE "config_audit_log" DROP CONSTRAINT "config_audit_log_action_supported";
--> statement-breakpoint
ALTER TABLE "config_audit_log" ADD CONSTRAINT "config_audit_log_action_supported" CHECK ("action" IN ('create', 'delete', 'update'));
--> statement-breakpoint
ALTER TABLE "config_audit_log" DROP CONSTRAINT "config_audit_log_snapshot_shape";
--> statement-breakpoint
ALTER TABLE "config_audit_log" ADD CONSTRAINT "config_audit_log_snapshot_shape" CHECK (
  ("action" = 'create' AND "old_value" IS NULL AND "new_value" IS NOT NULL)
  OR ("action" = 'delete' AND "old_value" IS NOT NULL AND "new_value" IS NULL)
  OR ("action" = 'update' AND "old_value" IS NOT NULL AND "new_value" IS NOT NULL)
);
