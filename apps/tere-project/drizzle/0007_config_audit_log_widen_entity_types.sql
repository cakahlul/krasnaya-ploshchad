ALTER TABLE "config_audit_log" DROP CONSTRAINT "config_audit_log_entity_supported";
--> statement-breakpoint
ALTER TABLE "config_audit_log" ADD CONSTRAINT "config_audit_log_entity_supported" CHECK ("entity_type" IN ('wp_weight_config', 'holiday', 'target_wp_config'));
--> statement-breakpoint
DROP INDEX "config_audit_log_wp_weight_cursor_idx";
--> statement-breakpoint
CREATE INDEX "config_audit_log_cursor_idx"
ON "config_audit_log" ("entity_type", "changed_at" DESC, "id" DESC);
