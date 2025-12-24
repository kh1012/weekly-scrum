-- =====================================================
-- snapshot_entries 삭제 정책 수정
-- 작성자(author)도 본인이 작성한 엔트리를 삭제할 수 있도록 변경
-- =====================================================

-- 1. 기존 삭제 정책 삭제
DROP POLICY IF EXISTS "entries_delete_leader" ON snapshot_entries;

-- 2. 새로운 삭제 정책 생성 (작성자 또는 leader/admin이 삭제 가능)
CREATE POLICY "entries_delete_author_or_leader"
  ON snapshot_entries
  FOR DELETE
  TO authenticated
  USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND (
      author_id = auth.uid()
      OR public.is_workspace_admin_or_leader(workspace_id, auth.uid())
    )
  );

-- 3. 정책 확인
SELECT 
  policyname AS "정책명",
  cmd AS "명령",
  qual AS "USING 조건"
FROM pg_policies
WHERE tablename = 'snapshot_entries'
  AND cmd = 'DELETE'
ORDER BY policyname;

