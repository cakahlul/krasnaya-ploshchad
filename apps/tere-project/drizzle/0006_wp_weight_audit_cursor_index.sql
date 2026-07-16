CREATE INDEX "config_audit_log_wp_weight_cursor_idx"
ON "config_audit_log" ("changed_at" DESC, "id" DESC)
WHERE "entity_type" = 'wp_weight_config';
