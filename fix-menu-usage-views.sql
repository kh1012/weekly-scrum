-- Fix menu usage views to include display_name from profiles
-- This enables User Activity tab to show user names properly

-- Drop existing views (if any dependencies, handle them first)
DROP VIEW IF EXISTS public.v_user_menu_usage_weekly;

-- Recreate v_user_menu_usage_weekly with profiles join
CREATE VIEW public.v_user_menu_usage_weekly AS
SELECT
  me.workspace_id,
  date_trunc('week'::text, (me.occurred_at AT TIME ZONE 'Asia/Seoul'::text)) AS week_start_seoul,
  me.user_id,
  p.display_name,
  COALESCE(me.menu_group, 'unknown'::text) AS menu_group,
  COALESCE(me.menu_key, 'unknown'::text) AS menu_key,
  count(*) AS event_count
FROM menu_events me
LEFT JOIN profiles p ON me.user_id = p.user_id
WHERE me.user_id IS NOT NULL
GROUP BY
  me.workspace_id,
  (date_trunc('week'::text, (me.occurred_at AT TIME ZONE 'Asia/Seoul'::text))),
  me.user_id,
  p.display_name,
  (COALESCE(me.menu_group, 'unknown'::text)),
  (COALESCE(me.menu_key, 'unknown'::text));

-- Verify the view works
-- SELECT * FROM v_user_menu_usage_weekly LIMIT 10;

