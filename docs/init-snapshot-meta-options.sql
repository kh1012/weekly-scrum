-- =====================================================
-- snapshot_meta_options 테이블 초기 데이터 삽입
-- 중복 방지: 이미 존재하는 데이터는 건너뜀
-- =====================================================

DO $$
DECLARE
  v_workspace_id uuid;
  v_count integer;
BEGIN
  -- 첫 번째 워크스페이스 ID 가져오기 (또는 특정 워크스페이스 ID 지정)
  SELECT id INTO v_workspace_id FROM workspaces LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found. Please create a workspace first.';
  END IF;

  -- 이미 데이터가 있는지 확인
  SELECT COUNT(*) INTO v_count 
  FROM snapshot_meta_options 
  WHERE workspace_id = v_workspace_id;

  IF v_count > 0 THEN
    RAISE NOTICE 'Snapshot meta options already exist for workspace % (% records found). Skipping insertion.', v_workspace_id, v_count;
    RETURN;
  END IF;

  -- Domain 옵션
  INSERT INTO snapshot_meta_options (workspace_id, category, value, order_index, is_active)
  VALUES
    (v_workspace_id, 'domain', 'Planning', 0, true),
    (v_workspace_id, 'domain', 'Design', 1, true),
    (v_workspace_id, 'domain', 'Frontend', 2, true),
    (v_workspace_id, 'domain', 'Backend', 3, true),
    (v_workspace_id, 'domain', 'Operation', 4, true),
    (v_workspace_id, 'domain', 'Collaboration', 5, true),
    (v_workspace_id, 'domain', 'Content', 6, true),
    (v_workspace_id, 'domain', 'Research', 7, true);

  -- Project 옵션
  INSERT INTO snapshot_meta_options (workspace_id, category, value, order_index, is_active)
  VALUES
    (v_workspace_id, 'project', 'MOTIIV', 0, true),
    (v_workspace_id, 'project', 'M-Connector', 1, true),
    (v_workspace_id, 'project', 'M-Desk', 2, true),
    (v_workspace_id, 'project', 'Idea-forge', 3, true);

  -- Module 옵션 (MOTIIV)
  INSERT INTO snapshot_meta_options (workspace_id, category, value, label, order_index, is_active)
  VALUES
    (v_workspace_id, 'module', 'Home', 'MOTIIV - Home', 0, true),
    (v_workspace_id, 'module', 'Discovery', 'MOTIIV - Discovery', 1, true),
    (v_workspace_id, 'module', 'Spreadsheet', 'MOTIIV - Spreadsheet', 2, true),
    (v_workspace_id, 'module', 'Workspace', 'MOTIIV - Workspace', 3, true),
    (v_workspace_id, 'module', 'Account', 'MOTIIV - Account', 4, true),
    (v_workspace_id, 'module', 'Engagement System', 'MOTIIV - Engagement System', 5, true),
    (v_workspace_id, 'module', 'Navigation', 'MOTIIV - Navigation', 6, true),
    (v_workspace_id, 'module', 'Tracking', 'MOTIIV - Tracking', 7, true);

  -- Feature 옵션
  INSERT INTO snapshot_meta_options (workspace_id, category, value, order_index, is_active)
  VALUES
    (v_workspace_id, 'feature', 'Rich note', 0, true),
    (v_workspace_id, 'feature', 'Formula-Tracer', 1, true);

  -- Name 옵션
  INSERT INTO snapshot_meta_options (workspace_id, category, value, order_index, is_active)
  VALUES
    (v_workspace_id, 'name', '이하영', 0, true),
    (v_workspace_id, 'name', '손영민', 1, true),
    (v_workspace_id, 'name', '변창언', 2, true),
    (v_workspace_id, 'name', '김상리', 3, true),
    (v_workspace_id, 'name', '김지원', 4, true),
    (v_workspace_id, 'name', '양소희', 5, true),
    (v_workspace_id, 'name', '한내경', 6, true),
    (v_workspace_id, 'name', '윤재웅', 7, true),
    (v_workspace_id, 'name', '하성열', 8, true),
    (v_workspace_id, 'name', '조해용', 9, true),
    (v_workspace_id, 'name', '도기봉', 10, true),
    (v_workspace_id, 'name', '김희성', 11, true),
    (v_workspace_id, 'name', '김용수', 12, true),
    (v_workspace_id, 'name', '김현', 13, true),
    (v_workspace_id, 'name', '김정빈', 14, true),
    (v_workspace_id, 'name', '김태이', 15, true),
    (v_workspace_id, 'name', '서상준', 16, true);

  RAISE NOTICE 'Snapshot meta options initialized successfully for workspace: %', v_workspace_id;
END $$;

-- 확인 쿼리
SELECT 
  category,
  COUNT(*) as count,
  string_agg(value, ', ' ORDER BY order_index) as values
FROM snapshot_meta_options
WHERE is_active = true
GROUP BY category
ORDER BY category;

