-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 Profile 문제 디버깅 SQL
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 현재 로그인한 사용자 확인
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- 2. 현재 사용자의 프로필 확인
SELECT 
  user_id,
  display_name,
  email,
  created_at,
  updated_at
FROM public.profiles
WHERE user_id = auth.uid();

-- 3. 현재 사용자의 workspace_members 확인
SELECT 
  workspace_id,
  user_id,
  role::text as role,
  created_at
FROM public.workspace_members
WHERE user_id = auth.uid();

-- 4. profiles 테이블 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. workspace_members 테이블 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'workspace_members'
ORDER BY policyname;

-- 6. workspace_role enum 값 확인
SELECT 
  e.enumlabel as role_value,
  e.enumsortorder
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' 
  AND t.typname = 'workspace_role'
ORDER BY e.enumsortorder;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 💡 다음 단계:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 1. Supabase SQL Editor에서 위 쿼리를 실행하세요
-- 2. 결과를 확인하고 다음을 체크하세요:
--    - current_user_id가 null이 아닌지
--    - profiles에 이미 데이터가 있는지
--    - workspace_members에 등록되어 있는지
--    - workspace_role enum에 'manager'가 있는지
-- 
-- 3. 만약 프로필이 이미 있다면:
--    - 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
--    - 로그아웃 후 재로그인
--    - 또는 아래 임시 해결 방법 사용
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 임시 해결 방법 (프로필이 있는데 온보딩으로 가는 경우)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Option A: RLS 일시 비활성화 (테스트용)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- 
-- 테스트 후 반드시 다시 활성화:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Option B: 프로필이 없는 경우 강제 생성
-- INSERT INTO public.profiles (user_id, display_name, email)
-- VALUES (
--   auth.uid(),
--   '본인이름',
--   auth.email()
-- )
-- ON CONFLICT (user_id) DO NOTHING;

-- Option C: workspace_members에 등록되지 않은 경우
-- INSERT INTO public.workspace_members (workspace_id, user_id, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001', -- DEFAULT_WORKSPACE_ID
--   auth.uid(),
--   'member'
-- )
-- ON CONFLICT (workspace_id, user_id) DO NOTHING;

