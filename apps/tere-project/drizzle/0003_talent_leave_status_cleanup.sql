UPDATE talent_leave
SET leave_date = COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        WHEN item ->> 'status' = 'Confirmed' THEN jsonb_set(item, '{status}', '"Leave"'::jsonb)
        ELSE item
      END
    )
    FROM jsonb_array_elements(leave_date) AS item
    WHERE item ->> 'status' <> 'Draft'
  ),
  '[]'::jsonb
),
updated_at = NOW();
