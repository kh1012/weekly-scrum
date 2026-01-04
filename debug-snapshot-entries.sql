-- ============================================
-- 스냅샷 엔트리 데이터 구조 검증 SQL
-- ============================================
-- 이 SQL을 프로덕션과 데모 DB에서 각각 실행하여 비교하세요.

-- ============================================
-- 1. 기본 통계 확인
-- ============================================
SELECT 
  '기본 통계' as category,
  COUNT(*) as total_entries,
  COUNT(DISTINCT snapshot_id) as unique_snapshots,
  COUNT(DISTINCT author_id) as unique_authors,
  COUNT(DISTINCT workspace_id) as unique_workspaces
FROM snapshot_entries;

-- ============================================
-- 2. Workspace별 엔트리 수
-- ============================================
SELECT 
  'Workspace별 엔트리 수' as category,
  workspace_id,
  COUNT(*) as entry_count,
  MIN(created_at) as earliest_entry,
  MAX(created_at) as latest_entry
FROM snapshot_entries
GROUP BY workspace_id
ORDER BY workspace_id;

-- ============================================
-- 3. 최근 10개 엔트리의 기본 정보
-- ============================================
SELECT 
  '최근 엔트리 샘플' as category,
  id,
  snapshot_id,
  author_id,
  workspace_id,
  created_at,
  updated_at
FROM snapshot_entries
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 4. past_week.tasks 데이터 타입 및 구조 확인
-- ============================================
SELECT 
  'past_week.tasks 타입 확인' as category,
  id,
  workspace_id,
  jsonb_typeof(past_week) as past_week_type,
  jsonb_typeof(past_week->'tasks') as tasks_type,
  CASE 
    WHEN jsonb_typeof(past_week->'tasks') = 'array' THEN 
      CASE 
        WHEN jsonb_array_length(past_week->'tasks') > 0 THEN
          jsonb_typeof(past_week->'tasks'->0)
        ELSE 'empty_array'
      END
    ELSE 'not_array'
  END as first_task_type,
  past_week->'tasks'->0 as first_task_sample
FROM snapshot_entries
WHERE past_week IS NOT NULL 
  AND past_week->'tasks' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 5. this_week.tasks 데이터 타입 및 구조 확인
-- ============================================
SELECT 
  'this_week.tasks 타입 확인' as category,
  id,
  workspace_id,
  jsonb_typeof(this_week) as this_week_type,
  jsonb_typeof(this_week->'tasks') as tasks_type,
  CASE 
    WHEN jsonb_typeof(this_week->'tasks') = 'array' THEN 
      CASE 
        WHEN jsonb_array_length(this_week->'tasks') > 0 THEN
          jsonb_typeof(this_week->'tasks'->0)
        ELSE 'empty_array'
      END
    ELSE 'not_array'
  END as first_task_type,
  this_week->'tasks'->0 as first_task_sample
FROM snapshot_entries
WHERE this_week IS NOT NULL 
  AND this_week->'tasks' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 6. risks 데이터 타입 및 구조 확인
-- ============================================
SELECT 
  'risks 타입 확인' as category,
  id,
  workspace_id,
  jsonb_typeof(risks) as risks_type,
  CASE 
    WHEN jsonb_typeof(risks) = 'array' THEN 
      CASE 
        WHEN jsonb_array_length(risks) > 0 THEN
          jsonb_typeof(risks->0)
        ELSE 'empty_array'
      END
    ELSE 'not_array'
  END as first_risk_type,
  risks->0 as first_risk_sample
FROM snapshot_entries
WHERE risks IS NOT NULL 
  AND jsonb_typeof(risks) = 'array'
  AND jsonb_array_length(risks) > 0
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 7. collaborators 데이터 타입 및 구조 확인
-- ============================================
SELECT 
  'collaborators 타입 확인' as category,
  id,
  workspace_id,
  jsonb_typeof(collaborators) as collaborators_type,
  jsonb_array_length(collaborators) as collaborators_count,
  collaborators->0 as first_collaborator_sample
FROM snapshot_entries
WHERE collaborators IS NOT NULL 
  AND jsonb_typeof(collaborators) = 'array'
  AND jsonb_array_length(collaborators) > 0
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 8. 문자열 vs 객체 혼재 확인 (tasks)
-- ============================================
SELECT 
  '데이터 타입 혼재 확인' as category,
  workspace_id,
  COUNT(*) as total_entries,
  SUM(CASE 
    WHEN past_week->'tasks'->0 IS NOT NULL 
      AND jsonb_typeof(past_week->'tasks'->0) = 'string' 
    THEN 1 ELSE 0 END) as past_week_tasks_string_count,
  SUM(CASE 
    WHEN past_week->'tasks'->0 IS NOT NULL 
      AND jsonb_typeof(past_week->'tasks'->0) = 'object' 
    THEN 1 ELSE 0 END) as past_week_tasks_object_count,
  SUM(CASE 
    WHEN this_week->'tasks'->0 IS NOT NULL 
      AND jsonb_typeof(this_week->'tasks'->0) = 'string' 
    THEN 1 ELSE 0 END) as this_week_tasks_string_count,
  SUM(CASE 
    WHEN this_week->'tasks'->0 IS NOT NULL 
      AND jsonb_typeof(this_week->'tasks'->0) = 'object' 
    THEN 1 ELSE 0 END) as this_week_tasks_object_count,
  SUM(CASE 
    WHEN risks->0 IS NOT NULL 
      AND jsonb_typeof(risks->0) = 'string' 
    THEN 1 ELSE 0 END) as risks_string_count,
  SUM(CASE 
    WHEN risks->0 IS NOT NULL 
      AND jsonb_typeof(risks->0) = 'object' 
    THEN 1 ELSE 0 END) as risks_object_count
FROM snapshot_entries
GROUP BY workspace_id;

-- ============================================
-- 9. 완전한 샘플 엔트리 1개 (전체 JSON 구조 확인)
-- ============================================
SELECT 
  '완전한 샘플 엔트리' as category,
  id,
  snapshot_id,
  author_id,
  workspace_id,
  created_at,
  past_week,
  this_week,
  risks,
  collaborators
FROM snapshot_entries
WHERE workspace_id IN (
  '00000000-0000-0000-0000-000000000001',  -- PROD
  '00000000-0000-0000-0000-000000000002'   -- DEMO
)
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 10. Team-feed에서 사용하는 최근 6주 데이터 확인
-- ============================================
WITH recent_snapshots AS (
  SELECT 
    id,
    workspace_id,
    year,
    week,
    created_at
  FROM snapshots
  WHERE workspace_id IN (
    '00000000-0000-0000-0000-000000000001',  -- PROD
    '00000000-0000-0000-0000-000000000002'   -- DEMO
  )
  ORDER BY year DESC, week DESC
  LIMIT 6
)
SELECT 
  'Team-feed 6주 데이터' as category,
  rs.workspace_id,
  rs.year,
  rs.week,
  COUNT(DISTINCT se.id) as entry_count,
  COUNT(DISTINCT se.author_id) as author_count,
  STRING_AGG(DISTINCT 
    CASE 
      WHEN se.this_week->'tasks'->0 IS NOT NULL THEN
        jsonb_typeof(se.this_week->'tasks'->0)
      ELSE 'null'
    END, 
    ', '
  ) as task_types_found
FROM recent_snapshots rs
LEFT JOIN snapshot_entries se ON se.snapshot_id = rs.id
GROUP BY rs.workspace_id, rs.year, rs.week
ORDER BY rs.year DESC, rs.week DESC;

-- ============================================
-- 11. NULL 및 빈 값 확인
-- ============================================
SELECT 
  'NULL 및 빈 값 통계' as category,
  workspace_id,
  COUNT(*) as total_entries,
  SUM(CASE WHEN past_week IS NULL THEN 1 ELSE 0 END) as past_week_null,
  SUM(CASE WHEN this_week IS NULL THEN 1 ELSE 0 END) as this_week_null,
  SUM(CASE WHEN risks IS NULL THEN 1 ELSE 0 END) as risks_null,
  SUM(CASE WHEN collaborators IS NULL THEN 1 ELSE 0 END) as collaborators_null,
  SUM(CASE WHEN past_week->'tasks' IS NULL THEN 1 ELSE 0 END) as past_week_tasks_null,
  SUM(CASE WHEN this_week->'tasks' IS NULL THEN 1 ELSE 0 END) as this_week_tasks_null
FROM snapshot_entries
GROUP BY workspace_id;

