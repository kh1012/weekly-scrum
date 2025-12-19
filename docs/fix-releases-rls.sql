-- =================================================
-- releases 테이블 RLS 활성화 및 정책 추가
-- Supabase SQL Editor에서 실행
-- =================================================

-- 1. RLS 활성화
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- 2. 모든 사용자 조회 가능
DROP POLICY IF EXISTS "releases_select_all" ON releases;
CREATE POLICY "releases_select_all"
  ON releases
  FOR SELECT
  USING (true);

-- 3. admin만 수정 가능
DROP POLICY IF EXISTS "releases_admin_full_access" ON releases;
CREATE POLICY "releases_admin_full_access"
  ON releases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. 확인
SELECT 
  tablename,
  rowsecurity AS "RLS 활성화"
FROM pg_tables
WHERE tablename = 'releases'
  AND schemaname = 'public';

-- 5. 정책 확인
SELECT 
  policyname AS "정책명",
  cmd AS "명령"
FROM pg_policies
WHERE tablename = 'releases'
ORDER BY policyname;

