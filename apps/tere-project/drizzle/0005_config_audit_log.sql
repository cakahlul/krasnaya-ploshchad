CREATE TABLE "config_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"changed_by" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "config_audit_log_actor_nonblank" CHECK (btrim("changed_by") <> ''),
	CONSTRAINT "config_audit_log_entity_supported" CHECK ("entity_type" = 'wp_weight_config'),
	CONSTRAINT "config_audit_log_action_supported" CHECK ("action" IN ('create', 'delete')),
	CONSTRAINT "config_audit_log_snapshot_shape" CHECK (
		("action" = 'create' AND "old_value" IS NULL AND "new_value" IS NOT NULL)
		OR ("action" = 'delete' AND "old_value" IS NOT NULL AND "new_value" IS NULL)
	)
);
