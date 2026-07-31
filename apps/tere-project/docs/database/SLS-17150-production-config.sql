-- SLS-17150 production configuration. USER-RUN ONLY, after migrations 0009 and 0010.
-- Review each bug_jql before execution. Later custom filters belong in this column.

BEGIN;

DO $config$
BEGIN
  IF EXISTS (SELECT 1 FROM boards WHERE board_id = -1 AND short_name <> 'INCL') THEN
    RAISE EXCEPTION 'board_id -1 is already used; choose another negative internal ID for INCL';
  END IF;
END
$config$;

INSERT INTO boards (
  board_id, name, short_name, is_subtask_type, is_kanban,
  is_show_planned_wp, is_bug_monitoring, bug_issue_type,
  bug_jql, is_story_grouping, reporting_group
)
SELECT
  -1, 'Incident Lending', 'INCL', false, false,
  false, true, NULL,
  'project = INCL ORDER BY created DESC', false, 'Loan'
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE short_name = 'INCL');

UPDATE boards
SET reporting_group = CASE short_name
      WHEN 'LGS' THEN 'Loan'
      WHEN 'GEN' THEN 'Loan'
      WHEN 'FCAD' THEN 'Transaction'
      WHEN 'FFE' THEN 'Transaction'
      WHEN 'QF' THEN 'Transaction'
      WHEN 'KYO' THEN 'Transaction'
      WHEN 'SLS' THEN 'User'
      WHEN 'DS' THEN 'User'
    END
WHERE is_bug_monitoring = false
  AND short_name IN ('LGS', 'GEN', 'FCAD', 'FFE', 'QF', 'KYO', 'SLS', 'DS');

UPDATE boards
SET reporting_group = CASE short_name
      WHEN 'INCL' THEN 'Loan'
      WHEN 'INCF' THEN 'Transaction'
      WHEN 'BUZZ' THEN 'User'
    END,
    bug_jql = COALESCE(bug_jql, CASE short_name
      WHEN 'INCL' THEN 'project = INCL ORDER BY created DESC'
      WHEN 'INCF' THEN 'project = INCF ORDER BY created DESC'
      WHEN 'BUZZ' THEN 'project = BUZZ AND issuetype = BugProduction ORDER BY created DESC'
    END)
WHERE is_bug_monitoring = true
  AND short_name IN ('INCL', 'INCF', 'BUZZ');

DO $verify$
BEGIN
  IF (SELECT COUNT(*) FROM boards WHERE short_name IN ('INCL', 'INCF', 'BUZZ') AND is_bug_monitoring) <> 3 THEN
    RAISE EXCEPTION 'expected exactly three bug project configurations: INCL, INCF, BUZZ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM boards
    WHERE short_name IN ('INCL', 'INCF', 'BUZZ')
      AND (reporting_group IS NULL OR bug_jql IS NULL OR btrim(bug_jql) = '')
  ) THEN
    RAISE EXCEPTION 'bug project configuration is incomplete';
  END IF;
END
$verify$;

SELECT board_id, name, short_name, reporting_group, bug_issue_type, bug_jql
FROM boards
WHERE is_bug_monitoring = true
ORDER BY reporting_group;

COMMIT;
