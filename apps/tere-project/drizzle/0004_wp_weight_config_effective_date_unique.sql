DO $wpwc$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM wp_weight_config
    GROUP BY effective_date
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add wp_weight_config effective_date uniqueness: duplicate dates exist';
  END IF;
END
$wpwc$;
--> statement-breakpoint
ALTER TABLE "wp_weight_config"
ADD CONSTRAINT "wp_weight_config_effective_date_unique" UNIQUE("effective_date");
