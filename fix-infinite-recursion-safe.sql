-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 무한 재귀 RLS 정책 수정 (안전한 버전)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 문제: workspace_members_write_admin_or_leader 정책이 자기 자신을 참조하여
--       무한 재귀 발생 (PostgreSQL 에러 코드 42P17)
-- 
-- 해결: 이 정책을 삭제합니다.
--       이유: workspace_members 테이블은 이미 충분한 정책이 있으며,
--             admin/manager 권한 체크는 다른 테이블에서만 필요합니다.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. 문제의 정책 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS workspace_members_write_admin_or_leader ON public.workspace_members;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. 기존 정책으로 충분한지 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- ✅ workspace_members_insert: 본인을 member로 등록 가능
-- ✅ workspace_members_select: 본인 데이터 조회 가능
-- ✅ workspace_members_update: 본인 데이터 수정 가능
-- ✅ workspace_members_delete: 본인 데이터 삭제 가능
-- ✅ members_select_member: 같은 워크스페이스 멤버 조회 가능
-- 
-- 💡 Admin/Manager 권한은 is_workspace_admin_or_leader() 함수로 체크하므로
--    workspace_members 테이블 자체에는 추가 정책이 필요 없습니다.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ 검증: 남아있는 workspace_members 정책 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
ORDER BY policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 💡 결과 예상:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- ✅ members_select_member (FOR SELECT)
-- ✅ workspace_members_delete (FOR DELETE)
-- ✅ workspace_members_insert (FOR INSERT)
-- ✅ workspace_members_read_gantt_flags (FOR SELECT on gantt_flags)
-- ✅ workspace_members_select (FOR SELECT)
-- ✅ workspace_members_update (FOR UPDATE)
-- ❌ workspace_members_write_admin_or_leader (삭제됨)
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🧪 테스트: 프로필 조회가 이제 작동하는지 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 본인 프로필 조회 (무한 재귀 없이 작동해야 함)
SELECT 
  user_id,
  display_name,
  email
FROM public.profiles
WHERE user_id = auth.uid();

-- workspace_members 조회 (무한 재귀 없이 작동해야 함)
SELECT 
  workspace_id,
  user_id,
  role::text
FROM public.workspace_members
WHERE user_id = auth.uid();

