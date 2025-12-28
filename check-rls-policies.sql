-- workspace_members UPDATE 정책의 상세 내용 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as "USING (조건)",
  with_check as "WITH CHECK (조건)"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'workspace_members'
  AND cmd = 'UPDATE'
ORDER BY policyname;

