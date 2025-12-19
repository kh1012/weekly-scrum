-- =========================
-- Feedback 기능 스키마
-- =========================

-- =========================
-- 1. ENUM 정의
-- =========================
CREATE TYPE IF NOT EXISTS feedback_status AS ENUM (
  'open',
  'in_progress',
  'resolved'
);

-- =========================
-- 2. releases 테이블
-- =========================
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 3. feedbacks 테이블
-- =========================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  author_user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT,
  content TEXT NOT NULL,
  
  status feedback_status NOT NULL DEFAULT 'open',
  
  resolved_release_id UUID
    REFERENCES releases(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =========================
-- 4. updated_at 자동 갱신
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedbacks_updated_at ON feedbacks;

CREATE TRIGGER feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================
-- 5. resolved 상태 규칙 강제
-- =========================
CREATE OR REPLACE FUNCTION enforce_feedback_resolve_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' THEN
    IF NEW.resolved_release_id IS NULL THEN
      RAISE EXCEPTION 'resolved 상태에서는 resolved_release_id가 필수입니다';
    END IF;
    
    IF OLD.status <> 'resolved' THEN
      NEW.resolved_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedbacks_resolve_rules ON feedbacks;

CREATE TRIGGER feedbacks_resolve_rules
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION enforce_feedback_resolve_rules();

-- =========================
-- 6. RLS 활성화
-- =========================
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- =========================
-- 7. feedbacks - member 정책 (본인 글만)
-- =========================
CREATE POLICY "member_select_own_feedback"
  ON feedbacks
  FOR SELECT
  USING (auth.uid() = author_user_id);

CREATE POLICY "member_insert_feedback"
  ON feedbacks
  FOR INSERT
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "member_update_own_feedback"
  ON feedbacks
  FOR UPDATE
  USING (auth.uid() = author_user_id)
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "member_delete_own_feedback"
  ON feedbacks
  FOR DELETE
  USING (auth.uid() = author_user_id);

-- =========================
-- 8. feedbacks - leader / admin 전체 권한
-- =========================
CREATE POLICY "leader_admin_full_access_feedback"
  ON feedbacks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('leader', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('leader', 'admin')
    )
  );

-- =========================
-- 9. releases - 모든 사용자 조회 가능
-- =========================
CREATE POLICY "releases_select_all"
  ON releases
  FOR SELECT
  USING (true);

-- =========================
-- 10. releases - admin만 수정 가능
-- =========================
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

-- =========================
-- 11. 인덱스 추가
-- =========================
CREATE INDEX IF NOT EXISTS idx_feedbacks_author ON feedbacks(author_user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- =========================
-- 확인
-- =========================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('feedbacks', 'releases')
ORDER BY table_name, ordinal_position;

