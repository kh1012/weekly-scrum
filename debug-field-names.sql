-- ============================================
-- 스냅샷 엔트리 필드명 확인
-- ============================================
-- team-feed.ts에서는 'past_week', 'this_week'를 사용하지만
-- 실제 DB 컬럼명이 다를 수 있습니다.

-- 1. snapshot_entries 테이블 컬럼 정보 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'snapshot_entries'
ORDER BY ordinal_position;

-- 2. snapshot_entries 샘플 데이터 확인 (모든 필드)
SELECT *
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',  -- PROD
  '00000000-0000-0000-0000-000000000002'   -- DEMO
)
ORDER BY created_at DESC
LIMIT 3;

-- 3. 특정 필드 존재 여부 확인
SELECT 
  workspace_id,
  -- past_week
  CASE WHEN past_week IS NOT NULL THEN 'has_past_week' ELSE 'no_past_week' END as past_week_status,
  -- this_week
  CASE WHEN this_week IS NOT NULL THEN 'has_this_week' ELSE 'no_this_week' END as this_week_status,
  COUNT(*) as count
FROM snapshot_entries
GROUP BY 
  workspace_id,
  CASE WHEN past_week IS NOT NULL THEN 'has_past_week' ELSE 'no_past_week' END,
  CASE WHEN this_week IS NOT NULL THEN 'has_this_week' ELSE 'no_this_week' END;

