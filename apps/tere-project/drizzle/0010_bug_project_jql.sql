-- SLS-17150 forward migration. USER-RUN ONLY.
-- Adds an optional project-specific JQL. NULL preserves the existing generated query.

ALTER TABLE "boards" ADD COLUMN "bug_jql" text;
