-- =====================================================
-- snapshot_meta_options 테이블 RLS 정책, 제약 조건, 인덱스
-- - SELECT/INSERT/UPDATE/DELETE: admin/leader만 가능
-- - UNIQUE 제약: (workspace_id, category, value)
-- - 인덱스: 성능 최적화
-- =====================================================

-- UNIQUE 제약 조건 추가
ALTER TABLE "public"."snapshot_meta_options"
  DROP CONSTRAINT IF EXISTS "ux_snapshot_meta_options_workspace_category_value";

ALTER TABLE "public"."snapshot_meta_options"
  ADD CONSTRAINT "ux_snapshot_meta_options_workspace_category_value"
  UNIQUE ("workspace_id", "category", "value");

-- 인덱스 추가 (조회 성능 최적화)
DROP INDEX IF EXISTS "idx_snapshot_meta_options_workspace_category";
DROP INDEX IF EXISTS "idx_snapshot_meta_options_workspace_category_order";

CREATE INDEX "idx_snapshot_meta_options_workspace_category"
  ON "public"."snapshot_meta_options" ("workspace_id", "category");

CREATE INDEX "idx_snapshot_meta_options_workspace_category_order"
  ON "public"."snapshot_meta_options" ("workspace_id", "category", "order_index", "value");

-- RLS 활성화
ALTER TABLE "public"."snapshot_meta_options" ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "allow_meta_options_read_admin_leader" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "allow_meta_options_insert_admin_leader" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "allow_meta_options_update_admin_leader" ON "public"."snapshot_meta_options";
DROP POLICY IF EXISTS "allow_meta_options_delete_admin_leader" ON "public"."snapshot_meta_options";

-- SELECT: admin/leader만 조회 가능
CREATE POLICY "allow_meta_options_read_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR SELECT TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."workspace_members"
      WHERE "workspace_members"."workspace_id" = "snapshot_meta_options"."workspace_id"
        AND "workspace_members"."user_id" = "auth"."uid"()
        AND "workspace_members"."role" IN ('admin', 'leader')
    )
  );

-- INSERT: admin/leader만 생성 가능
CREATE POLICY "allow_meta_options_insert_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."workspace_members"
      WHERE "workspace_members"."workspace_id" = "snapshot_meta_options"."workspace_id"
        AND "workspace_members"."user_id" = "auth"."uid"()
        AND "workspace_members"."role" IN ('admin', 'leader')
    )
  );

-- UPDATE: admin/leader만 수정 가능
CREATE POLICY "allow_meta_options_update_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR UPDATE TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."workspace_members"
      WHERE "workspace_members"."workspace_id" = "snapshot_meta_options"."workspace_id"
        AND "workspace_members"."user_id" = "auth"."uid"()
        AND "workspace_members"."role" IN ('admin', 'leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."workspace_members"
      WHERE "workspace_members"."workspace_id" = "snapshot_meta_options"."workspace_id"
        AND "workspace_members"."user_id" = "auth"."uid"()
        AND "workspace_members"."role" IN ('admin', 'leader')
    )
  );

-- DELETE: admin/leader만 삭제 가능
CREATE POLICY "allow_meta_options_delete_admin_leader"
  ON "public"."snapshot_meta_options"
  FOR DELETE TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."workspace_members"
      WHERE "workspace_members"."workspace_id" = "snapshot_meta_options"."workspace_id"
        AND "workspace_members"."user_id" = "auth"."uid"()
        AND "workspace_members"."role" IN ('admin', 'leader')
    )
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

