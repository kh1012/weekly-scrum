-- ============================================================================
-- Fix all menu usage views to properly count unique users and display names
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- 1. Drop existing views (in reverse dependency order)
DROP VIEW IF EXISTS public.v_user_menu_usage_weekly;
DROP VIEW IF EXISTS public.v_page_usage_weekly;
DROP VIEW IF EXISTS public.v_menu_usage_weekly;

-- ============================================================================
-- 2. Create v_menu_usage_weekly with unique_users count
-- ============================================================================
CREATE VIEW public.v_menu_usage_weekly AS
SELECT
  workspace_id,
  date_trunc('week'::text, (occurred_at AT TIME ZONE 'Asia/Seoul'::text)) AS week_start_seoul,
  COALESCE(menu_group, 'unknown'::text) AS menu_group,
  COALESCE(menu_key, 'unknown'::text) AS menu_key,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM menu_events
GROUP BY
  workspace_id,
  (date_trunc('week'::text, (occurred_at AT TIME ZONE 'Asia/Seoul'::text))),
  (COALESCE(menu_group, 'unknown'::text)),
  (COALESCE(menu_key, 'unknown'::text)),
  event_type;

-- ============================================================================
-- 3. Create v_page_usage_weekly with unique_users count
-- ============================================================================
CREATE VIEW public.v_page_usage_weekly AS
SELECT
  workspace_id,
  date_trunc('week'::text, (occurred_at AT TIME ZONE 'Asia/Seoul'::text)) AS week_start_seoul,
  page_path,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM menu_events
GROUP BY
  workspace_id,
  (date_trunc('week'::text, (occurred_at AT TIME ZONE 'Asia/Seoul'::text))),
  page_path;

-- ============================================================================
-- 4. Create v_user_menu_usage_weekly with display_name from profiles
-- ============================================================================
CREATE VIEW public.v_user_menu_usage_weekly AS
SELECT
  me.workspace_id,
  date_trunc('week'::text, (me.occurred_at AT TIME ZONE 'Asia/Seoul'::text)) AS week_start_seoul,
  me.user_id,
  p.display_name,
  COALESCE(me.menu_group, 'unknown'::text) AS menu_group,
  COALESCE(me.menu_key, 'unknown'::text) AS menu_key,
  COUNT(*) AS event_count
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

-- ============================================================================
-- 5. Verification queries (uncomment to test)
-- ============================================================================

-- Check if user_id is being collected
-- SELECT user_id, COUNT(*) as count 
-- FROM menu_events 
-- WHERE user_id IS NOT NULL 
-- GROUP BY user_id 
-- ORDER BY count DESC 
-- LIMIT 10;

-- Check menu usage view
-- SELECT * FROM v_menu_usage_weekly 
-- ORDER BY week_start_seoul DESC 
-- LIMIT 10;

-- Check page usage view
-- SELECT * FROM v_page_usage_weekly 
-- ORDER BY week_start_seoul DESC 
-- LIMIT 10;

-- Check user menu usage view
-- SELECT * FROM v_user_menu_usage_weekly 
-- ORDER BY week_start_seoul DESC 
-- LIMIT 10;

-- Check raw menu_events data
-- SELECT 
--   workspace_id,
--   user_id,
--   event_type,
--   menu_group,
--   menu_key,
--   page_path,
--   occurred_at
-- FROM menu_events 
-- ORDER BY occurred_at DESC 
-- LIMIT 20;

