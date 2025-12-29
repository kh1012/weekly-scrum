-- ============================================================================
-- Clean up development/test telemetry data
-- This removes data collected during testing/development
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- WARNING: This will permanently delete data. Review queries before running.

-- ============================================================================
-- 1. Check what will be deleted (run this first to preview)
-- ============================================================================

-- Count localhost referrer events
SELECT COUNT(*) as localhost_events
FROM menu_events
WHERE referrer LIKE '%localhost%';

-- Count developer email events
SELECT 
  COUNT(*) as dev_events,
  user_id
FROM menu_events me
WHERE user_id IN (
  SELECT user_id 
  FROM auth.users 
  WHERE email IN ('kh1012@midasit.com', 'zrelor@gmail.com')
)
GROUP BY user_id;

-- Show sample of data to be deleted
SELECT 
  id,
  user_id,
  event_type,
  page_path,
  referrer,
  occurred_at
FROM menu_events
WHERE 
  referrer LIKE '%localhost%'
  OR user_id IN (
    SELECT user_id 
    FROM auth.users 
    WHERE email IN ('kh1012@midasit.com', 'zrelor@gmail.com')
  )
ORDER BY occurred_at DESC
LIMIT 20;

-- ============================================================================
-- 2. Delete development data (uncomment to execute)
-- ============================================================================

-- Delete localhost referrer events
-- DELETE FROM menu_events
-- WHERE referrer LIKE '%localhost%';

-- Delete developer email events
-- DELETE FROM menu_events
-- WHERE user_id IN (
--   SELECT user_id 
--   FROM auth.users 
--   WHERE email IN ('kh1012@midasit.com', 'zrelor@gmail.com')
-- );

-- ============================================================================
-- 3. Verify deletion (run after delete to confirm)
-- ============================================================================

-- Check remaining event count
-- SELECT COUNT(*) as remaining_events FROM menu_events;

-- Check if any localhost/dev data remains
-- SELECT COUNT(*) as should_be_zero
-- FROM menu_events
-- WHERE 
--   referrer LIKE '%localhost%'
--   OR user_id IN (
--     SELECT user_id 
--     FROM auth.users 
--     WHERE email IN ('kh1012@midasit.com', 'zrelor@gmail.com')
--   );

