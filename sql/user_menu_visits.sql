-- 사용자별 메뉴 방문 기록 테이블
CREATE TABLE IF NOT EXISTS user_menu_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  menu_key TEXT NOT NULL,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 복합 유니크 제약: 사용자당 메뉴별로 하나의 레코드만
  CONSTRAINT user_menu_visits_unique UNIQUE (workspace_id, user_id, menu_key)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_menu_visits_user 
  ON user_menu_visits(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_menu_visits_menu 
  ON user_menu_visits(workspace_id, menu_key);

-- RLS 정책
ALTER TABLE user_menu_visits ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 방문 기록만 조회 가능
CREATE POLICY "Users can view own menu visits"
  ON user_menu_visits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 방문 기록만 생성/수정 가능
CREATE POLICY "Users can insert own menu visits"
  ON user_menu_visits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menu visits"
  ON user_menu_visits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_menu_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_menu_visits_updated_at
  BEFORE UPDATE ON user_menu_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_menu_visits_updated_at();

-- 코멘트
COMMENT ON TABLE user_menu_visits IS '사용자별 메뉴 방문 기록 (새 데이터 알림용)';
COMMENT ON COLUMN user_menu_visits.menu_key IS '메뉴 키 (feedbacks, team-feed, plans, snapshots 등)';
COMMENT ON COLUMN user_menu_visits.last_visited_at IS '마지막 방문 시간';

