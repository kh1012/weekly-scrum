-- SNB 메뉴 설정 관리 테이블
-- workspace별로 각 메뉴의 노출 여부와 태그를 관리

CREATE TABLE IF NOT EXISTS menu_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  menu_key text NOT NULL, -- e.g., "team-feed", "plans", "snapshots", "work-map", etc.
  is_enabled boolean DEFAULT true NOT NULL, -- 메뉴 노출 여부
  tag_label text, -- 태그 라벨 (e.g., "NEW", "BETA", "HOT")
  tag_color text CHECK (tag_color IN ('blue', 'green', 'orange', 'pink', 'purple', 'gray')), -- 태그 색상
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, menu_key)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_menu_settings_workspace ON menu_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_menu_settings_enabled ON menu_settings(workspace_id, is_enabled);

-- RLS 정책 설정
ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;

-- workspace 멤버는 자신의 workspace 설정을 읽을 수 있음
CREATE POLICY "menu_settings_select_policy" ON menu_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = menu_settings.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- admin/manager만 설정을 수정할 수 있음
CREATE POLICY "menu_settings_insert_policy" ON menu_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = menu_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "menu_settings_update_policy" ON menu_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = menu_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "menu_settings_delete_policy" ON menu_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = menu_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'manager')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_menu_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_settings_updated_at_trigger
  BEFORE UPDATE ON menu_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_settings_updated_at();

-- 주석 추가
COMMENT ON TABLE menu_settings IS 'SNB 메뉴의 노출 여부와 태그를 workspace별로 관리하는 테이블';
COMMENT ON COLUMN menu_settings.menu_key IS '메뉴 고유 키 (e.g., team-feed, plans, snapshots)';
COMMENT ON COLUMN menu_settings.is_enabled IS '메뉴 노출 여부 (true: 표시, false: 숨김)';
COMMENT ON COLUMN menu_settings.tag_label IS '메뉴에 표시할 태그 라벨 (e.g., NEW, BETA)';
COMMENT ON COLUMN menu_settings.tag_color IS '태그 색상 테마';

