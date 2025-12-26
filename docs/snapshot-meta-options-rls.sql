-- =====================================================
-- snapshot_meta_options 테이블 RLS 정책
-- - SELECT: 워크스페이스 멤버 누구나 조회 가능
-- - INSERT/UPDATE/DELETE: admin/leader만 가능
-- =====================================================

-- RLS 활성화
ALTER TABLE "public"."snapshot_meta_options" ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "meta_options_select_members" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "meta_options_insert_admin_leader" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "meta_options_update_admin_leader" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "meta_options_delete_admin_leader" ON "public"."snapshot_meta_options";

-- SELECT: 워크스페이스 멤버 누구나 조회 가능
CREATE POLICY "meta_options_select_members"
  ON "public"."snapshot_meta_options"
  FOR SELECT TO "authenticated"
  USING (
    "public"."is_workspace_member"("workspace_id", "auth"."uid"())
  );

-- INSERT: admin/leader만 생성 가능
CREATE POLICY "meta_options_insert_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND
    "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())
  );

-- UPDATE: admin/leader만 수정 가능
CREATE POLICY "meta_options_update_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR UPDATE TO "authenticated"
  USING (
    "public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND
    "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())
  )
  WITH CHECK (
    "public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND
    "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())
  );

-- DELETE: admin/leader만 삭제 가능
CREATE POLICY "meta_options_delete_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR DELETE TO "authenticated"
  USING (
    "public"."is_workspace_member"("workspace_id", "auth"."uid"()) AND
    "public"."is_workspace_admin_or_leader"("workspace_id", "auth"."uid"())
  );

-- 정책 확인
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
WHERE tablename = 'snapshot_meta_options'
ORDER BY policyname;

