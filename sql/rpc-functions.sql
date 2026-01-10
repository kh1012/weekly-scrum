-- ============================================================
-- RPC Functions for Performance Optimization
-- ============================================================

-- ============================================================
-- 1. 사용자의 최근 엔트리 조회 (JOIN 최적화)
-- ============================================================
CREATE OR REPLACE FUNCTION get_recent_user_entries(
  p_workspace_id TEXT,
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  domain TEXT,
  project TEXT,
  module TEXT,
  feature TEXT,
  updated_at TIMESTAMPTZ,
  year INTEGER,
  week TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.id,
    se.name,
    se.domain,
    se.project,
    se.module,
    se.feature,
    COALESCE(se.updated_at, se.created_at) as updated_at,
    s.year,
    s.week
  FROM snapshot_entries se
  JOIN snapshots s ON s.id = se.snapshot_id
  WHERE s.workspace_id = p_workspace_id
    AND s.author_id = p_user_id
  ORDER BY COALESCE(se.updated_at, se.created_at) DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- 2. 워크스페이스 메뉴 통계 조회 (사용자별 항목 포함)
-- ============================================================
CREATE OR REPLACE FUNCTION get_menu_stats_fast(
  p_workspace_id TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  feedbacks_count BIGINT,
  snapshots_count BIGINT,
  total_entries_count BIGINT,
  plans_count BIGINT,
  features_count BIGINT,
  collaborations_count BIGINT,
  my_entries_count BIGINT,
  alignment_count BIGINT,
  workspace_alignment_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_my_entries_count BIGINT := 0;
  v_alignment_count BIGINT := 0;
BEGIN
  -- 사용자별 데이터 (있는 경우만)
  IF p_user_id IS NOT NULL THEN
    -- 내 엔트리 수
    SELECT COUNT(*)
    INTO v_my_entries_count
    FROM snapshot_entries se
    JOIN snapshots s ON s.id = se.snapshot_id
    WHERE s.workspace_id = p_workspace_id
      AND s.author_id = p_user_id;
    
    -- Alignment 수 (할당된 Plans + 현재 주차 엔트리)
    WITH current_week AS (
      SELECT 
        EXTRACT(YEAR FROM CURRENT_DATE) as year,
        'W' || LPAD(EXTRACT(WEEK FROM CURRENT_DATE)::TEXT, 2, '0') as week
    ),
    assigned_plans AS (
      SELECT COUNT(*) as cnt
      FROM plan_assignees pa
      JOIN plans p ON p.id = pa.plan_id
      WHERE p.workspace_id = p_workspace_id
        AND pa.user_id = p_user_id
    ),
    current_week_entries AS (
      SELECT COUNT(*) as cnt
      FROM snapshot_entries se
      JOIN snapshots s ON s.id = se.snapshot_id
      CROSS JOIN current_week cw
      WHERE s.workspace_id = p_workspace_id
        AND s.author_id = p_user_id
        AND s.year = cw.year
        AND s.week = cw.week
    )
    SELECT (ap.cnt + cwe.cnt)
    INTO v_alignment_count
    FROM assigned_plans ap, current_week_entries cwe;
  END IF;
  
  -- Materialized View에서 워크스페이스 통계 조회
  RETURN QUERY
  SELECT 
    wms.feedbacks_count,
    wms.snapshots_count,
    wms.total_entries_count,
    wms.plans_count,
    wms.features_count,
    wms.collaborations_count,
    v_my_entries_count as my_entries_count,
    v_alignment_count as alignment_count,
    (wms.plans_count + wms.total_entries_count) as workspace_alignment_count
  FROM workspace_menu_stats wms
  WHERE wms.workspace_id = p_workspace_id;
  
  -- Materialized View가 없는 경우 직접 계산
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      (SELECT COUNT(*) FROM feedbacks WHERE workspace_id = p_workspace_id),
      (SELECT COUNT(DISTINCT snapshot_id) FROM snapshot_entries WHERE workspace_id = p_workspace_id),
      (SELECT COUNT(*) FROM snapshot_entries WHERE workspace_id = p_workspace_id),
      (SELECT COUNT(*) FROM plans WHERE workspace_id = p_workspace_id),
      (SELECT COUNT(DISTINCT feature) FROM snapshot_entries WHERE workspace_id = p_workspace_id AND feature IS NOT NULL),
      (SELECT SUM(jsonb_array_length(collaborators))::BIGINT FROM snapshot_entries WHERE workspace_id = p_workspace_id AND collaborators IS NOT NULL),
      v_my_entries_count,
      v_alignment_count,
      (SELECT COUNT(*) FROM plans WHERE workspace_id = p_workspace_id) + 
      (SELECT COUNT(*) FROM snapshot_entries WHERE workspace_id = p_workspace_id);
  END IF;
END;
$$;

-- ============================================================
-- 3. 주차별 엔트리 수 빠른 조회
-- ============================================================
CREATE OR REPLACE FUNCTION get_weekly_trend_fast(
  p_workspace_id TEXT,
  p_user_id TEXT,
  p_weeks_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  week TEXT,
  count BIGINT,
  avg_progress NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(wes.year, '-', wes.week) as week,
    wes.entry_count as count,
    COALESCE(wes.avg_progress, 0) as avg_progress
  FROM weekly_entry_stats wes
  WHERE wes.workspace_id = p_workspace_id
    AND wes.author_id = p_user_id
  ORDER BY wes.year DESC, wes.week DESC
  LIMIT p_weeks_limit;
END;
$$;

COMMENT ON FUNCTION get_recent_user_entries IS 
'사용자의 최근 엔트리를 빠르게 조회 (JOIN 최적화)';

COMMENT ON FUNCTION get_menu_stats_fast IS 
'메뉴 통계를 Materialized View에서 빠르게 조회';

COMMENT ON FUNCTION get_weekly_trend_fast IS 
'주차별 추이를 Materialized View에서 빠르게 조회';
