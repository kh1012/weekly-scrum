-- ============================================
-- 데이터 타입 확인 (핵심 쿼리만)
-- ============================================

-- 1. 데이터 샘플 및 타입 확인 (가장 중요!)
SELECT 
  workspace_id,
  id,
  created_at,
  -- past_week.tasks의 첫 번째 요소
  jsonb_typeof(past_week->'tasks'->0) as past_week_task_type,
  past_week->'tasks'->0 as past_week_task_sample,
  
  -- this_week.tasks의 첫 번째 요소
  jsonb_typeof(this_week->'tasks'->0) as this_week_task_type,
  this_week->'tasks'->0 as this_week_task_sample,
  
  -- risks의 첫 번째 요소
  jsonb_typeof(risks->0) as risk_type,
  risks->0 as risk_sample
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',  -- PROD
  '00000000-0000-0000-0000-000000000002'   -- DEMO
)
AND (
  (past_week->'tasks' IS NOT NULL AND jsonb_array_length(past_week->'tasks') > 0)
  OR (this_week->'tasks' IS NOT NULL AND jsonb_array_length(this_week->'tasks') > 0)
  OR (risks IS NOT NULL AND jsonb_array_length(risks) > 0)
)
ORDER BY workspace_id, created_at DESC
LIMIT 10;

-- 2. 타입별 집계 (string vs object)
SELECT 
  workspace_id,
  'past_week.tasks' as field,
  SUM(CASE WHEN jsonb_typeof(past_week->'tasks'->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(past_week->'tasks'->0) = 'object' THEN 1 ELSE 0 END) as object_count,
  SUM(CASE WHEN jsonb_typeof(past_week->'tasks'->0) NOT IN ('string', 'object') THEN 1 ELSE 0 END) as other_count
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
AND past_week->'tasks'->0 IS NOT NULL
GROUP BY workspace_id

UNION ALL

SELECT 
  workspace_id,
  'this_week.tasks' as field,
  SUM(CASE WHEN jsonb_typeof(this_week->'tasks'->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(this_week->'tasks'->0) = 'object' THEN 1 ELSE 0 END) as object_count,
  SUM(CASE WHEN jsonb_typeof(this_week->'tasks'->0) NOT IN ('string', 'object') THEN 1 ELSE 0 END) as other_count
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
AND this_week->'tasks'->0 IS NOT NULL
GROUP BY workspace_id

UNION ALL

SELECT 
  workspace_id,
  'risks' as field,
  SUM(CASE WHEN jsonb_typeof(risks->0) = 'string' THEN 1 ELSE 0 END) as string_count,
  SUM(CASE WHEN jsonb_typeof(risks->0) = 'object' THEN 1 ELSE 0 END) as object_count,
  SUM(CASE WHEN jsonb_typeof(risks->0) NOT IN ('string', 'object') THEN 1 ELSE 0 END) as other_count
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
AND risks->0 IS NOT NULL
GROUP BY workspace_id
ORDER BY workspace_id, field;

