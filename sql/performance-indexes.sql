-- ============================================================
-- Performance Indexes
-- ============================================================
-- 자주 조회되는 필드에 인덱스를 추가하여 쿼리 성능 향상

-- ============================================================
-- 1. Snapshots 테이블 인덱스
-- ============================================================

-- workspace_id + author_id (사용자별 스냅샷 조회)
CREATE INDEX IF NOT EXISTS idx_snapshots_workspace_author 
  ON snapshots(workspace_id, author_id) 
  WHERE author_id IS NOT NULL;

-- workspace_id + year + week (주차별 조회)
CREATE INDEX IF NOT EXISTS idx_snapshots_workspace_year_week 
  ON snapshots(workspace_id, year, week);

-- author_id + year + week (사용자의 특정 주차 조회)
CREATE INDEX IF NOT EXISTS idx_snapshots_author_year_week 
  ON snapshots(author_id, year, week) 
  WHERE author_id IS NOT NULL;

-- updated_at (최근 업데이트 조회)
CREATE INDEX IF NOT EXISTS idx_snapshots_updated_at 
  ON snapshots(updated_at DESC);

-- ============================================================
-- 2. Snapshot Entries 테이블 인덱스
-- ============================================================

-- workspace_id (워크스페이스별 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace 
  ON snapshot_entries(workspace_id);

-- snapshot_id (특정 스냅샷의 엔트리 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_snapshot 
  ON snapshot_entries(snapshot_id);

-- workspace_id + snapshot_id (복합 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace_snapshot 
  ON snapshot_entries(workspace_id, snapshot_id);

-- workspace_id + domain (도메인별 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace_domain 
  ON snapshot_entries(workspace_id, domain) 
  WHERE domain IS NOT NULL;

-- workspace_id + project (프로젝트별 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace_project 
  ON snapshot_entries(workspace_id, project) 
  WHERE project IS NOT NULL;

-- workspace_id + feature (피처별 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace_feature 
  ON snapshot_entries(workspace_id, feature) 
  WHERE feature IS NOT NULL;

-- updated_at (최근 엔트리 조회)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_updated_at 
  ON snapshot_entries(updated_at DESC NULLS LAST);

-- workspace_id + author_id (사용자의 엔트리 조회 - JOIN 최적화)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_workspace_author 
  ON snapshot_entries(workspace_id, author_id) 
  WHERE author_id IS NOT NULL;

-- collaborators (협업자 검색 - GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_snapshot_entries_collaborators 
  ON snapshot_entries USING GIN (collaborators) 
  WHERE collaborators IS NOT NULL;

-- ============================================================
-- 3. Plans 테이블 인덱스
-- ============================================================

-- workspace_id (워크스페이스별 조회)
CREATE INDEX IF NOT EXISTS idx_plans_workspace 
  ON plans(workspace_id);

-- workspace_id + status (상태별 조회)
CREATE INDEX IF NOT EXISTS idx_plans_workspace_status 
  ON plans(workspace_id, status);

-- updated_at (최근 업데이트 조회)
CREATE INDEX IF NOT EXISTS idx_plans_updated_at 
  ON plans(updated_at DESC);

-- start_date + end_date (기간별 조회)
CREATE INDEX IF NOT EXISTS idx_plans_date_range 
  ON plans(start_date, end_date);

-- ============================================================
-- 4. Plan Assignees 테이블 인덱스
-- ============================================================

-- user_id (사용자별 할당 Plans)
CREATE INDEX IF NOT EXISTS idx_plan_assignees_user 
  ON plan_assignees(user_id);

-- plan_id (Plan별 할당자)
CREATE INDEX IF NOT EXISTS idx_plan_assignees_plan 
  ON plan_assignees(plan_id);

-- user_id + plan_id (복합 조회)
CREATE INDEX IF NOT EXISTS idx_plan_assignees_user_plan 
  ON plan_assignees(user_id, plan_id);

-- ============================================================
-- 5. Menu Events 테이블 인덱스
-- ============================================================

-- workspace_id + user_id + event_type (사용자 이벤트 조회)
CREATE INDEX IF NOT EXISTS idx_menu_events_workspace_user_type 
  ON menu_events(workspace_id, user_id, event_type);

-- workspace_id + user_id + occurred_at (시간순 조회)
CREATE INDEX IF NOT EXISTS idx_menu_events_workspace_user_time 
  ON menu_events(workspace_id, user_id, occurred_at DESC);

-- occurred_at (최근 이벤트 조회)
CREATE INDEX IF NOT EXISTS idx_menu_events_occurred_at 
  ON menu_events(occurred_at DESC);

-- workspace_id + event_type + occurred_at (이벤트 타입별 시간순)
CREATE INDEX IF NOT EXISTS idx_menu_events_workspace_type_time 
  ON menu_events(workspace_id, event_type, occurred_at DESC);

-- ============================================================
-- 6. Feedbacks 테이블 인덱스
-- ============================================================

-- workspace_id (워크스페이스별 조회)
CREATE INDEX IF NOT EXISTS idx_feedbacks_workspace 
  ON feedbacks(workspace_id);

-- workspace_id + status (상태별 조회)
CREATE INDEX IF NOT EXISTS idx_feedbacks_workspace_status 
  ON feedbacks(workspace_id, status);

-- created_at (최근 피드백 조회)
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at 
  ON feedbacks(created_at DESC);

-- ============================================================
-- 7. Profiles 테이블 인덱스
-- ============================================================

-- user_id (사용자 조회 - 이미 기본 키일 수 있음)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON profiles(user_id);

-- display_name (이름 검색)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name 
  ON profiles(display_name) 
  WHERE display_name IS NOT NULL;

-- ============================================================
-- 8. Workspace Members 테이블 인덱스
-- ============================================================

-- workspace_id (워크스페이스별 멤버 조회)
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace 
  ON workspace_members(workspace_id);

-- user_id (사용자의 워크스페이스 조회)
CREATE INDEX IF NOT EXISTS idx_workspace_members_user 
  ON workspace_members(user_id);

-- workspace_id + user_id (복합 조회)
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user 
  ON workspace_members(workspace_id, user_id);

-- ============================================================
-- 인덱스 사용 통계 확인 쿼리
-- ============================================================

-- 인덱스 사용 현황 확인
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- 사용되지 않는 인덱스 확인
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
--   AND schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

COMMENT ON INDEX idx_snapshots_workspace_author IS 
'사용자별 스냅샷 조회 최적화';

COMMENT ON INDEX idx_snapshot_entries_workspace_snapshot IS 
'워크스페이스별 스냅샷 엔트리 조회 최적화';

COMMENT ON INDEX idx_menu_events_workspace_user_type IS 
'사용자 이벤트 조회 최적화';
