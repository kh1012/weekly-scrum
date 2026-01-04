-- ============================================
-- 스냅샷 엔트리 빠른 검증 (간단 버전)
-- ============================================

-- 1. 기본 통계
SELECT 
  workspace_id,
  COUNT(*) as total_entries,
  COUNT(DISTINCT snapshot_id) as unique_snapshots,
  MAX(created_at) as latest_entry
FROM snapshot_entries
GROUP BY workspace_id;

-- 2. 데이터 타입 문제 확인 (핵심)
SELECT 
  workspace_id,
  id,
  -- past_week.tasks의 첫 번째 요소 타입
  jsonb_typeof(past_week->'tasks'->0) as past_week_task_type,
  past_week->'tasks'->0 as past_week_task_sample,
  
  -- this_week.tasks의 첫 번째 요소 타입
  jsonb_typeof(this_week->'tasks'->0) as this_week_task_type,
  this_week->'tasks'->0 as this_week_task_sample,
  
  -- risks의 첫 번째 요소 타입
  jsonb_typeof(risks->0) as risk_type,
  risks->0 as risk_sample
FROM snapshot_entries
WHERE (
  (past_week->'tasks' IS NOT NULL AND jsonb_array_length(past_week->'tasks') > 0)
  OR (this_week->'tasks' IS NOT NULL AND jsonb_array_length(this_week->'tasks') > 0)
  OR (risks IS NOT NULL AND jsonb_array_length(risks) > 0)
)
ORDER BY created_at DESC
LIMIT 5;

-- 3. 타입 혼재 통계 (string vs object)
SELECT 
  workspace_id,
  'past_week.tasks' as field,
  SUM(CASE WHEN jsonb_typeof(past_week->'tasks'->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(past_week->'tasks'->0) = 'object' THEN 1 ELSE 0 END) as object_count
FROM snapshot_entries
WHERE past_week->'tasks'->0 IS NOT NULL
GROUP BY workspace_id

UNION ALL

SELECT 
  workspace_id,
  'this_week.tasks' as field,
  SUM(CASE WHEN jsonb_typeof(this_week->'tasks'->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(this_week->'tasks'->0) = 'object' THEN 1 ELSE 0 END) as object_count
FROM snapshot_entries
WHERE this_week->'tasks'->0 IS NOT NULL
GROUP BY workspace_id

UNION ALL

SELECT 
  workspace_id,
  'risks' as field,
  SUM(CASE WHEN jsonb_typeof(risks->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(risks->0) = 'object' THEN 1 ELSE 0 END) as object_count
FROM snapshot_entries
WHERE risks->0 IS NOT NULL
GROUP BY workspace_id;

-- 4. Team-feed용 최근 데이터 확인
SELECT 
  s.workspace_id,
  s.year,
  s.week,
  COUNT(se.id) as entry_count,
  COUNT(DISTINCT se.author_id) as author_count
FROM snapshots s
LEFT JOIN snapshot_entries se ON se.snapshot_id = s.id
WHERE s.workspace_id IN (
  '00000000-0000-0000-0000-000000000001',  -- PROD
  '00000000-0000-0000-0000-000000000002'   -- DEMO
)
GROUP BY s.workspace_id, s.year, s.week
ORDER BY s.year DESC, s.week DESC
LIMIT 10;

