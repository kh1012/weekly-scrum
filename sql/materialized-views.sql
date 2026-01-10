-- ============================================================
-- Materialized Views for Performance Optimization
-- ============================================================
-- 집계 데이터를 미리 계산하여 쿼리 성능 향상
-- 주기적으로 REFRESH 필요 (백그라운드 작업으로 처리)

-- ============================================================
-- 1. 사용자별 스냅샷 통계
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS user_snapshot_stats CASCADE;

CREATE MATERIALIZED VIEW user_snapshot_stats AS
SELECT 
  s.workspace_id,
  s.author_id,
  COUNT(DISTINCT s.id) as snapshot_count,
  COUNT(DISTINCT CONCAT(s.year, '-', s.week)) as unique_weeks_count,
  COUNT(se.id) as total_entries_count,
  MAX(COALESCE(se.updated_at, se.created_at)) as last_entry_at
FROM snapshots s
LEFT JOIN snapshot_entries se ON se.snapshot_id = s.id
WHERE s.author_id IS NOT NULL
GROUP BY s.workspace_id, s.author_id;

-- 인덱스 생성
CREATE UNIQUE INDEX idx_user_snapshot_stats_pk 
  ON user_snapshot_stats(workspace_id, author_id);
CREATE INDEX idx_user_snapshot_stats_workspace 
  ON user_snapshot_stats(workspace_id);

-- ============================================================
-- 2. 주차별 엔트리 통계
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS weekly_entry_stats CASCADE;

CREATE MATERIALIZED VIEW weekly_entry_stats AS
SELECT 
  s.workspace_id,
  s.author_id,
  s.year,
  s.week,
  COUNT(se.id) as entry_count,
  COUNT(DISTINCT se.domain) as unique_domains_count,
  COUNT(DISTINCT se.project) as unique_projects_count,
  AVG(
    CASE 
      WHEN jsonb_array_length(COALESCE(se.past_week->>'tasks', '[]')::jsonb) > 0 
      THEN (
        SELECT AVG((task->>'progress')::numeric)
        FROM jsonb_array_elements(COALESCE(se.past_week->>'tasks', '[]')::jsonb) as task
        WHERE (task->>'progress')::numeric IS NOT NULL
      )
      ELSE NULL
    END
  ) as avg_progress
FROM snapshots s
LEFT JOIN snapshot_entries se ON se.snapshot_id = s.id
WHERE s.author_id IS NOT NULL
GROUP BY s.workspace_id, s.author_id, s.year, s.week;

-- 인덱스 생성
CREATE UNIQUE INDEX idx_weekly_entry_stats_pk 
  ON weekly_entry_stats(workspace_id, author_id, year, week);
CREATE INDEX idx_weekly_entry_stats_workspace_author 
  ON weekly_entry_stats(workspace_id, author_id);

-- ============================================================
-- 3. 도메인/프로젝트 분포
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS domain_project_distribution CASCADE;

CREATE MATERIALIZED VIEW domain_project_distribution AS
SELECT 
  se.workspace_id,
  s.author_id,
  CASE 
    WHEN se.domain IS NOT NULL AND se.project IS NOT NULL 
    THEN CONCAT(se.domain, ' / ', se.project)
    WHEN se.domain IS NOT NULL 
    THEN se.domain
    WHEN se.project IS NOT NULL 
    THEN se.project
    ELSE '미분류'
  END as domain_project_label,
  COUNT(*) as entry_count
FROM snapshot_entries se
JOIN snapshots s ON s.id = se.snapshot_id
WHERE s.author_id IS NOT NULL
GROUP BY se.workspace_id, s.author_id, domain_project_label;

-- 인덱스 생성
CREATE INDEX idx_domain_project_dist_workspace_author 
  ON domain_project_distribution(workspace_id, author_id);
CREATE INDEX idx_domain_project_dist_count 
  ON domain_project_distribution(workspace_id, author_id, entry_count DESC);

-- ============================================================
-- 4. 워크스페이스 메뉴 통계 (집계)
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS workspace_menu_stats CASCADE;

CREATE MATERIALIZED VIEW workspace_menu_stats AS
SELECT 
  workspace_id,
  (SELECT COUNT(*) FROM feedbacks WHERE workspace_id = w.workspace_id) as feedbacks_count,
  (SELECT COUNT(DISTINCT snapshot_id) FROM snapshot_entries WHERE workspace_id = w.workspace_id) as snapshots_count,
  (SELECT COUNT(*) FROM snapshot_entries WHERE workspace_id = w.workspace_id) as total_entries_count,
  (SELECT COUNT(*) FROM plans WHERE workspace_id = w.workspace_id) as plans_count,
  (SELECT COUNT(DISTINCT feature) FROM snapshot_entries WHERE workspace_id = w.workspace_id AND feature IS NOT NULL) as features_count,
  (
    SELECT SUM(jsonb_array_length(collaborators))::integer
    FROM snapshot_entries 
    WHERE workspace_id = w.workspace_id 
    AND collaborators IS NOT NULL
  ) as collaborations_count
FROM (
  SELECT DISTINCT workspace_id 
  FROM snapshots
  UNION
  SELECT DISTINCT workspace_id 
  FROM plans
) w;

-- 인덱스 생성
CREATE UNIQUE INDEX idx_workspace_menu_stats_pk 
  ON workspace_menu_stats(workspace_id);

-- ============================================================
-- 5. 사용자별 Plan 통계
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS user_plan_stats CASCADE;

CREATE MATERIALIZED VIEW user_plan_stats AS
SELECT 
  p.workspace_id,
  pa.user_id,
  COUNT(*) as assigned_total,
  COUNT(*) FILTER (
    WHERE LOWER(p.status) NOT IN ('done', 'closed', 'completed')
  ) as assigned_active
FROM plan_assignees pa
JOIN plans p ON p.id = pa.plan_id
GROUP BY p.workspace_id, pa.user_id;

-- 인덱스 생성
CREATE UNIQUE INDEX idx_user_plan_stats_pk 
  ON user_plan_stats(workspace_id, user_id);

-- ============================================================
-- Refresh 함수 생성
-- ============================================================
-- 모든 Materialized View를 한 번에 갱신하는 함수

CREATE OR REPLACE FUNCTION refresh_all_performance_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_snapshot_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_entry_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY domain_project_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_menu_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_plan_stats;
  
  RAISE NOTICE 'All performance materialized views refreshed successfully';
END;
$$;

-- 수동 갱신 방법:
-- SELECT refresh_all_performance_views();

-- ============================================================
-- 참고: RLS 정책 설정
-- ============================================================
-- Materialized View는 기본적으로 RLS가 적용되지 않으므로
-- 필요시 별도의 보안 함수를 생성해야 합니다

COMMENT ON MATERIALIZED VIEW user_snapshot_stats IS 
'사용자별 스냅샷 통계 - 5분마다 갱신 권장';

COMMENT ON MATERIALIZED VIEW weekly_entry_stats IS 
'주차별 엔트리 통계 - 30분마다 갱신 권장';

COMMENT ON MATERIALIZED VIEW domain_project_distribution IS 
'도메인/프로젝트 분포 - 1시간마다 갱신 권장';

COMMENT ON MATERIALIZED VIEW workspace_menu_stats IS 
'워크스페이스 메뉴 통계 - 15분마다 갱신 권장';

COMMENT ON MATERIALIZED VIEW user_plan_stats IS 
'사용자별 Plan 통계 - 15분마다 갱신 권장';
