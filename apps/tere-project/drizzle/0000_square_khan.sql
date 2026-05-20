CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "api_keys_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" integer NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"is_subtask_type" boolean DEFAULT false NOT NULL,
	"is_kanban" boolean DEFAULT false NOT NULL,
	"is_show_planned_wp" boolean DEFAULT false NOT NULL,
	"is_bug_monitoring" boolean DEFAULT false NOT NULL,
	"bug_issue_type" text,
	"is_story_grouping" boolean DEFAULT false NOT NULL,
	CONSTRAINT "boards_board_id_unique" UNIQUE("board_id")
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"is_national_holiday" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"level" text NOT NULL,
	"is_lead" boolean DEFAULT false NOT NULL,
	"teams" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "talent_leave" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"name" text NOT NULL,
	"team" text NOT NULL,
	"leave_date" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "talent_leave_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "target_wp_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"effective_date" date NOT NULL,
	"rates" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'Member' NOT NULL,
	CONSTRAINT "user_access_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wp_weight_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"effective_date" date NOT NULL,
	"weights" jsonb NOT NULL
);
