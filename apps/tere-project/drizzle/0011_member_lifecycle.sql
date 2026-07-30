-- SLS-17150 forward migration. USER-RUN ONLY.
ALTER TABLE "members"
  ADD COLUMN "join_date" date DEFAULT DATE '2025-01-01' NOT NULL,
  ADD COLUMN "resign_date" date,
  ADD CONSTRAINT "members_lifecycle_dates_ordered"
    CHECK ("resign_date" IS NULL OR "resign_date" >= "join_date");
