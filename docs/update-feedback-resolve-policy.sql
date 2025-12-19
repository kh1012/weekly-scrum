-- =====================================================
-- Feedback Resolve Policy 수정
-- resolved_release_id를 선택사항으로 변경
-- =====================================================

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS enforce_feedback_resolve_rules() CASCADE;

-- 2. 새로운 함수 생성 (resolved_release_id 선택사항)
CREATE OR REPLACE FUNCTION enforce_feedback_resolve_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- resolved 상태로 변경될 때 resolved_at 자동 설정
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;

  -- resolved 상태에서 다른 상태로 변경될 때 resolved_at 및 resolved_release_id 초기화
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.resolved_at = NULL;
    NEW.resolved_release_id = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 재생성 (중복 제거)
DROP TRIGGER IF EXISTS feedbacks_resolve_rules ON feedbacks;
DROP TRIGGER IF EXISTS trg_feedbacks_resolve_rules ON feedbacks;

CREATE TRIGGER feedbacks_resolve_rules
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION enforce_feedback_resolve_rules();

-- 4. 검증 쿼리
-- resolved_release_id 없이도 resolved 상태로 변경 가능한지 테스트
-- SELECT * FROM feedbacks WHERE status = 'resolved' AND resolved_release_id IS NULL;

