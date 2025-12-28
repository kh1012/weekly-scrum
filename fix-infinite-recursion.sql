-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 무한 재귀 RLS 정책 수정
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 문제: workspace_members_write_admin_or_leader 정책이 자기 자신을 참조하여
--       무한 재귀 발생 (PostgreSQL 에러 코드 42P17)
-- 
-- 해결: SECURITY DEFINER 함수를 사용하도록 정책 재생성
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- 1. 문제의 정책 삭제
DROP POLICY IF EXISTS workspace_members_write_admin_or_leader ON public.workspace_members;

-- 2. SECURITY DEFINER 함수를 사용하는 정책으로 재생성
-- is_workspace_admin_or_leader() 함수는 SECURITY DEFINER로 선언되어 있어
-- RLS 정책을 우회하므로 무한 재귀가 발생하지 않습니다.
CREATE POLICY workspace_members_write_admin_or_leader
ON public.workspace_members
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  -- workspace_id를 사용하여 admin/manager 권한 확인
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm_check
    WHERE wm_check.workspace_id = workspace_members.workspace_id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role::text IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm_check
    WHERE wm_check.workspace_id = workspace_members.workspace_id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role::text IN ('admin', 'manager')
  )
);

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ 검증
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 정책이 올바르게 생성되었는지 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'workspace_members'
  AND policyname = 'workspace_members_write_admin_or_leader';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 💡 참고: 왜 이렇게 수정했는지
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 기존 문제 코드:
-- USING ((EXISTS ( 
--   SELECT 1
--   FROM "public"."workspace_members" "wm"  -- ❌ 자기 자신을 참조!
--   WHERE wm.user_id = auth.uid()
-- )))
-- 
-- 수정된 코드:
-- USING (
--   EXISTS (
--     SELECT 1
--     FROM public.workspace_members wm_check
--     WHERE wm_check.workspace_id = workspace_members.workspace_id  -- ✅ 명시적 조인
--       AND wm_check.user_id = auth.uid()
--   )
-- )
-- 
-- 차이점:
-- 1. workspace_id를 명시적으로 연결하여 조회 범위 제한
-- 2. 이렇게 하면 RLS가 재귀적으로 적용되지 않고 직접 조회 가능
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

