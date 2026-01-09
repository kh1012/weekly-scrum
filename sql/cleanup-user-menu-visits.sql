-- =====================================================
-- Menu Usage 데이터 정리 SQL
-- =====================================================
-- 목적: user_menu_visits 테이블의 오염된 데이터를 정리
-- 작성일: 2026-01-08
-- 
-- 주의사항:
-- - 실행 전 반드시 데이터를 백업하세요
-- - 먼저 분석 쿼리로 현황을 파악한 후 정리 쿼리를 실행하세요
-- =====================================================

-- =====================================================
-- 섹션 1: 현황 분석 쿼리
-- =====================================================

-- 1-1. 전체 menu_key 목록 및 레코드 수
-- 용도: 현재 저장된 모든 menu_key와 각각의 사용 빈도 확인
SELECT 
  menu_key,
  COUNT(*) as record_count,
  COUNT(DISTINCT workspace_id) as workspace_count,
  COUNT(DISTINCT user_id) as user_count,
  MIN(last_visited_at) as earliest_visit,
  MAX(last_visited_at) as latest_visit
FROM user_menu_visits
GROUP BY menu_key
ORDER BY record_count DESC;

-- 1-2. 유효하지 않은 menu_key 식별
-- 현재 코드에서 사용하는 유효한 menu_key 목록:
-- 'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
-- 'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks',
    'team-feed',
    'plans',
    'snapshots',
    'work-map',
    'collaborator-graph',
    'alignment',
    'my-dashboard',
    'my-alignment',
    'my-snapshots'
  ]) AS valid_menu_key
)
SELECT 
  umv.menu_key,
  COUNT(*) as invalid_record_count,
  COUNT(DISTINCT umv.workspace_id) as affected_workspaces,
  COUNT(DISTINCT umv.user_id) as affected_users
FROM user_menu_visits umv
WHERE NOT EXISTS (
  SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
)
GROUP BY umv.menu_key
ORDER BY invalid_record_count DESC;

-- 1-3. workspace별 분포 확인
SELECT 
  workspace_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT menu_key) as unique_menu_keys,
  COUNT(DISTINCT user_id) as users_count,
  array_agg(DISTINCT menu_key ORDER BY menu_key) as menu_keys_list
FROM user_menu_visits
GROUP BY workspace_id
ORDER BY total_records DESC;

-- 1-4. user별 분포 확인 (상위 20명)
SELECT 
  workspace_id,
  user_id,
  COUNT(*) as menu_visits_count,
  array_agg(menu_key ORDER BY menu_key) as visited_menus,
  MAX(last_visited_at) as last_activity
FROM user_menu_visits
GROUP BY workspace_id, user_id
ORDER BY menu_visits_count DESC
LIMIT 20;

-- 1-5. 오래된 데이터 현황 (90일 이상 미방문)
SELECT 
  menu_key,
  COUNT(*) as stale_record_count,
  MIN(last_visited_at) as oldest_visit,
  MAX(last_visited_at) as newest_visit
FROM user_menu_visits
WHERE last_visited_at < NOW() - INTERVAL '90 days'
GROUP BY menu_key
ORDER BY stale_record_count DESC;


-- =====================================================
-- 섹션 2: 백업 가이드
-- =====================================================

-- 2-1. 전체 데이터 백업 테이블 생성
-- 실행 전 반드시 백업을 생성하세요
CREATE TABLE IF NOT EXISTS user_menu_visits_backup_20260108 AS
SELECT * FROM user_menu_visits;

-- 백업 확인
SELECT 
  'user_menu_visits' as table_name, 
  COUNT(*) as record_count 
FROM user_menu_visits
UNION ALL
SELECT 
  'user_menu_visits_backup_20260108' as table_name, 
  COUNT(*) as record_count 
FROM user_menu_visits_backup_20260108;

-- 2-2. 특정 menu_key만 백업 (선택적)
-- 예: 삭제 예정인 menu_key만 별도 백업
CREATE TABLE IF NOT EXISTS user_menu_visits_invalid_backup AS
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
SELECT umv.*
FROM user_menu_visits umv
WHERE NOT EXISTS (
  SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
);


-- =====================================================
-- 섹션 3: 데이터 정리 옵션
-- =====================================================

-- ----------------------------------------------------
-- 옵션 A: 유효하지 않은 menu_key만 삭제
-- ----------------------------------------------------
-- 설명: 현재 코드에서 사용하지 않는 menu_key를 모두 삭제합니다.
-- 주의: 삭제 전 반드시 백업을 생성하세요.

-- A-1. 삭제 예정 레코드 미리보기 (삭제 전 확인)
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
SELECT 
  umv.id,
  umv.workspace_id,
  umv.user_id,
  umv.menu_key,
  umv.last_visited_at
FROM user_menu_visits umv
WHERE NOT EXISTS (
  SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
)
ORDER BY umv.menu_key, umv.last_visited_at DESC;

-- A-2. 유효하지 않은 menu_key 삭제 실행
-- 주의: 이 쿼리는 실제로 데이터를 삭제합니다!
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
DELETE FROM user_menu_visits umv
WHERE NOT EXISTS (
  SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
);
-- 삭제 결과를 확인하려면 위 쿼리 뒤에 RETURNING * 를 추가하세요


-- ----------------------------------------------------
-- 옵션 B: 특정 menu_key를 다른 값으로 업데이트
-- ----------------------------------------------------
-- 설명: 라우팅 경로 변경으로 인해 menu_key가 변경된 경우 사용합니다.
-- 예시: 'old-key' -> 'new-key'

-- B-1. 업데이트 예정 레코드 미리보기
SELECT 
  id,
  workspace_id,
  user_id,
  menu_key,
  last_visited_at
FROM user_menu_visits
WHERE menu_key = 'old-key'  -- 변경할 이전 menu_key
ORDER BY last_visited_at DESC;

-- B-2. menu_key 업데이트 실행 (예시)
-- 주의: 실제 실행 시 'old-key'와 'new-key'를 적절한 값으로 변경하세요
/*
UPDATE user_menu_visits
SET menu_key = 'new-key',
    updated_at = NOW()
WHERE menu_key = 'old-key';
*/

-- B-3. 여러 menu_key를 한 번에 업데이트 (예시)
-- 여러 개의 경로 변경이 있는 경우 사용
/*
UPDATE user_menu_visits
SET menu_key = CASE menu_key
  WHEN 'old-key-1' THEN 'new-key-1'
  WHEN 'old-key-2' THEN 'new-key-2'
  WHEN 'old-key-3' THEN 'new-key-3'
  ELSE menu_key
END,
updated_at = NOW()
WHERE menu_key IN ('old-key-1', 'old-key-2', 'old-key-3');
*/


-- ----------------------------------------------------
-- 옵션 C: 오래된 데이터 삭제 (90일 이상 미방문)
-- ----------------------------------------------------
-- 설명: 일정 기간 동안 방문하지 않은 오래된 기록을 정리합니다.

-- C-1. 삭제 예정 레코드 미리보기 (90일 이상 미방문)
SELECT 
  menu_key,
  COUNT(*) as delete_count,
  MIN(last_visited_at) as oldest_visit,
  MAX(last_visited_at) as newest_visit
FROM user_menu_visits
WHERE last_visited_at < NOW() - INTERVAL '90 days'
GROUP BY menu_key
ORDER BY delete_count DESC;

-- C-2. 90일 이상 미방문 레코드 삭제
-- 주의: 이 쿼리는 실제로 데이터를 삭제합니다!
/*
DELETE FROM user_menu_visits
WHERE last_visited_at < NOW() - INTERVAL '90 days';
*/

-- C-3. 특정 기간으로 조정 가능 (예: 180일)
/*
DELETE FROM user_menu_visits
WHERE last_visited_at < NOW() - INTERVAL '180 days';
*/


-- ----------------------------------------------------
-- 옵션 D: 전체 초기화
-- ----------------------------------------------------
-- 설명: 모든 메뉴 방문 기록을 삭제합니다.
-- 주의: 이 작업은 되돌릴 수 없습니다. 반드시 백업 후 실행하세요!

-- D-1. 전체 레코드 수 확인
SELECT COUNT(*) as total_records FROM user_menu_visits;

-- D-2. 전체 데이터 삭제
-- 주의: 실행하기 전에 백업을 확인하세요!
/*
TRUNCATE TABLE user_menu_visits;
-- 또는
DELETE FROM user_menu_visits;
*/


-- ----------------------------------------------------
-- 옵션 E: 특정 workspace의 데이터만 정리
-- ----------------------------------------------------
-- 설명: 특정 workspace의 오염된 데이터만 선택적으로 정리합니다.

-- E-1. 특정 workspace의 유효하지 않은 menu_key 확인
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
SELECT 
  menu_key,
  COUNT(*) as record_count
FROM user_menu_visits umv
WHERE workspace_id = 'YOUR-WORKSPACE-ID-HERE'  -- 실제 workspace_id로 변경
  AND NOT EXISTS (
    SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
  )
GROUP BY menu_key;

-- E-2. 특정 workspace의 유효하지 않은 menu_key 삭제
/*
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
DELETE FROM user_menu_visits umv
WHERE workspace_id = 'YOUR-WORKSPACE-ID-HERE'
  AND NOT EXISTS (
    SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
  );
*/


-- =====================================================
-- 섹션 4: 정리 후 검증 쿼리
-- =====================================================

-- 4-1. 남은 데이터 통계
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT workspace_id) as workspaces,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT menu_key) as unique_menu_keys,
  MIN(last_visited_at) as earliest_visit,
  MAX(last_visited_at) as latest_visit
FROM user_menu_visits;

-- 4-2. 정리 후 menu_key 목록 확인
SELECT 
  menu_key,
  COUNT(*) as record_count,
  COUNT(DISTINCT workspace_id) as workspace_count,
  COUNT(DISTINCT user_id) as user_count
FROM user_menu_visits
GROUP BY menu_key
ORDER BY record_count DESC;

-- 4-3. 유효성 재확인 (유효하지 않은 menu_key가 남아있는지 확인)
WITH valid_keys AS (
  SELECT unnest(ARRAY[
    'feedbacks', 'team-feed', 'plans', 'snapshots', 'work-map', 
    'collaborator-graph', 'alignment', 'my-dashboard', 'my-alignment', 'my-snapshots'
  ]) AS valid_menu_key
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ 모든 menu_key가 유효합니다'
    ELSE '✗ 유효하지 않은 menu_key가 ' || COUNT(*) || '개 남아있습니다'
  END as validation_result,
  CASE 
    WHEN COUNT(*) > 0 THEN array_agg(DISTINCT umv.menu_key)
    ELSE ARRAY[]::text[]
  END as invalid_keys_remaining
FROM user_menu_visits umv
WHERE NOT EXISTS (
  SELECT 1 FROM valid_keys vk WHERE vk.valid_menu_key = umv.menu_key
);

-- 4-4. workspace별 데이터 분포 재확인
SELECT 
  workspace_id,
  COUNT(*) as records,
  COUNT(DISTINCT menu_key) as menu_count,
  COUNT(DISTINCT user_id) as user_count,
  array_agg(DISTINCT menu_key ORDER BY menu_key) as menu_keys
FROM user_menu_visits
GROUP BY workspace_id
ORDER BY records DESC;

-- 4-5. 최근 활동 확인 (최근 7일)
SELECT 
  menu_key,
  COUNT(*) as recent_visits,
  COUNT(DISTINCT user_id) as active_users
FROM user_menu_visits
WHERE last_visited_at > NOW() - INTERVAL '7 days'
GROUP BY menu_key
ORDER BY recent_visits DESC;


-- =====================================================
-- 섹션 5: 백업 복원 (문제 발생 시)
-- =====================================================

-- 5-1. 백업에서 복원 (전체)
-- 주의: 현재 데이터를 완전히 대체합니다!
/*
-- 현재 데이터 삭제
TRUNCATE TABLE user_menu_visits;

-- 백업에서 복원
INSERT INTO user_menu_visits
SELECT * FROM user_menu_visits_backup_20260108;
*/

-- 5-2. 백업 데이터와 현재 데이터 비교
SELECT 
  'current' as source,
  COUNT(*) as record_count,
  COUNT(DISTINCT menu_key) as unique_keys
FROM user_menu_visits
UNION ALL
SELECT 
  'backup' as source,
  COUNT(*) as record_count,
  COUNT(DISTINCT menu_key) as unique_keys
FROM user_menu_visits_backup_20260108;


-- =====================================================
-- 섹션 6: 정리 후 유지보수 쿼리
-- =====================================================

-- 6-1. 중복 레코드 확인 (있어서는 안 됨)
-- UNIQUE 제약이 있지만 혹시 모를 상황 대비
SELECT 
  workspace_id,
  user_id,
  menu_key,
  COUNT(*) as duplicate_count
FROM user_menu_visits
GROUP BY workspace_id, user_id, menu_key
HAVING COUNT(*) > 1;

-- 6-2. 인덱스 재구성 (대량 삭제 후 권장)
/*
REINDEX TABLE user_menu_visits;
*/

-- 6-3. 테이블 통계 갱신 (대량 삭제 후 권장)
/*
ANALYZE user_menu_visits;
*/

-- 6-4. 테이블 크기 확인
SELECT 
  pg_size_pretty(pg_total_relation_size('user_menu_visits')) as total_size,
  pg_size_pretty(pg_relation_size('user_menu_visits')) as table_size,
  pg_size_pretty(pg_indexes_size('user_menu_visits')) as indexes_size;


-- =====================================================
-- 실행 가이드
-- =====================================================
-- 
-- 권장 실행 순서:
-- 1. [섹션 1] 현황 분석 쿼리로 현재 상태 파악
-- 2. [섹션 2] 백업 테이블 생성
-- 3. [섹션 3] 적절한 정리 옵션 선택 및 실행
-- 4. [섹션 4] 검증 쿼리로 정리 결과 확인
-- 5. [섹션 6] 유지보수 쿼리 실행 (선택적)
--
-- 문제 발생 시:
-- - [섹션 5] 백업 복원 쿼리 사용
--
-- =====================================================


