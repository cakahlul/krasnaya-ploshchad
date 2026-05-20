ALTER TABLE "members" ADD COLUMN "jira_id" text;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_jira_id_unique" UNIQUE("jira_id");