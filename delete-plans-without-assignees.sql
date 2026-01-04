-- ============================================
-- plan_assignees가 없는 plan 삭제
-- ============================================
-- 담당자가 지정되지 않은 고아(orphan) plan을 정리합니다.
-- ============================================

DO $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_workspace_id UUID := '00000000-0000-0000-0000-000000000002'; -- Demo workspace
BEGIN

  -- 삭제 전 카운트 확인
  SELECT COUNT(*)
  INTO v_deleted_count
  FROM plans p
  WHERE p.workspace_id = v_workspace_id
    AND NOT EXISTS (
      SELECT 1
      FROM plan_assignees pa
      WHERE pa.plan_id = p.id
    );

  RAISE NOTICE '삭제 대상 plan: %개', v_deleted_count;

  -- plan_assignees가 없는 plan 삭제
  DELETE FROM plans p
  WHERE p.workspace_id = v_workspace_id
    AND NOT EXISTS (
      SELECT 1
      FROM plan_assignees pa
      WHERE pa.plan_id = p.id
    );

  RAISE NOTICE '✅ %개의 plan이 삭제되었습니다.', v_deleted_count;

END $$;

-- ============================================
-- 전체 workspace 대상 (선택적)
-- ============================================
-- 특정 workspace가 아닌 모든 workspace의 orphan plan 삭제
/*
DO $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN

  -- 삭제 전 카운트 확인
  SELECT COUNT(*)
  INTO v_deleted_count
  FROM plans p
  WHERE NOT EXISTS (
    SELECT 1
    FROM plan_assignees pa
    WHERE pa.plan_id = p.id
  );

  RAISE NOTICE '삭제 대상 plan (전체 workspace): %개', v_deleted_count;

  -- plan_assignees가 없는 plan 삭제
  DELETE FROM plans p
  WHERE NOT EXISTS (
    SELECT 1
    FROM plan_assignees pa
    WHERE pa.plan_id = p.id
  );

  RAISE NOTICE '✅ %개의 plan이 삭제되었습니다.', v_deleted_count;

END $$;
*/


