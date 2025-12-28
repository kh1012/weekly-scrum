-- Fix unique_users calculation in menu/page usage views
-- Issue: unique_users is always 0 because it's counting session_id instead of user_id
-- Solution: Recreate views to count DISTINCT user_id

BEGIN;

-- Drop existing views
DROP VIEW IF EXISTS public.v_menu_usage_weekly CASCADE;
DROP VIEW IF EXISTS public.v_page_usage_weekly CASCADE;
DROP VIEW IF EXISTS public.v_user_menu_usage_weekly CASCADE;

-- Recreate v_menu_usage_weekly with correct unique_users calculation
CREATE OR REPLACE VIEW public.v_menu_usage_weekly AS
SELECT
  workspace_id,
  DATE_TRUNC('week', TIMEZONE('Asia/Seoul', created_at))::date AS week_start_seoul,
  menu_group,
  menu_key,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users -- Fixed: count user_id instead of session_id
FROM public.menu_events
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY
  workspace_id,
  week_start_seoul,
  menu_group,
  menu_key,
  event_type
ORDER BY
  workspace_id,
  week_start_seoul DESC,
  menu_group,
  menu_key,
  event_type;

COMMENT ON VIEW public.v_menu_usage_weekly IS 
'Weekly menu usage grouped by menu_group, menu_key, and event_type. 
Counts unique users (not sessions) for the last 12 weeks.';

-- Recreate v_page_usage_weekly with correct unique_users calculation
CREATE OR REPLACE VIEW public.v_page_usage_weekly AS
SELECT
  workspace_id,
  DATE_TRUNC('week', TIMEZONE('Asia/Seoul', created_at))::date AS week_start_seoul,
  page_path,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users -- Fixed: count user_id instead of session_id
FROM public.menu_events
WHERE
  created_at >= NOW() - INTERVAL '12 weeks'
  AND event_type = 'PAGE_VIEW'
GROUP BY
  workspace_id,
  week_start_seoul,
  page_path
ORDER BY
  workspace_id,
  week_start_seoul DESC,
  event_count DESC;

COMMENT ON VIEW public.v_page_usage_weekly IS 
'Weekly page usage grouped by page_path (PAGE_VIEW events only). 
Counts unique users (not sessions) for the last 12 weeks.';

-- Recreate v_user_menu_usage_weekly
CREATE OR REPLACE VIEW public.v_user_menu_usage_weekly AS
SELECT
  me.workspace_id,
  DATE_TRUNC('week', TIMEZONE('Asia/Seoul', me.created_at))::date AS week_start_seoul,
  me.user_id,
  p.display_name,
  me.menu_key,
  COUNT(*) AS event_count
FROM public.menu_events me
LEFT JOIN public.profiles p ON me.user_id = p.user_id
WHERE me.created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY
  me.workspace_id,
  week_start_seoul,
  me.user_id,
  p.display_name,
  me.menu_key
ORDER BY
  me.workspace_id,
  week_start_seoul DESC,
  event_count DESC;

COMMENT ON VIEW public.v_user_menu_usage_weekly IS 
'Weekly menu usage per user. 
Shows which users are using which menus for the last 12 weeks.';

-- Grant SELECT permissions
GRANT SELECT ON public.v_menu_usage_weekly TO authenticated;
GRANT SELECT ON public.v_page_usage_weekly TO authenticated;
GRANT SELECT ON public.v_user_menu_usage_weekly TO authenticated;

COMMIT;

-- Verification queries (run these to check the results)
-- SELECT * FROM public.v_menu_usage_weekly WHERE workspace_id = '00000000-0000-0000-0000-000000000001' LIMIT 10;
-- SELECT * FROM public.v_page_usage_weekly WHERE workspace_id = '00000000-0000-0000-0000-000000000001' LIMIT 10;
-- SELECT * FROM public.v_user_menu_usage_weekly WHERE workspace_id = '00000000-0000-0000-0000-000000000001' LIMIT 10;

