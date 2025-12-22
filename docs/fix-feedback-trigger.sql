-- Feedback 트리거 함수 수정: resolved_at, resolved_release_id 참조 제거
-- 
-- 문제: enforce_feedback_resolve_rules() 함수가 삭제된 컬럼(resolved_at, resolved_release_id)을 참조하여 오류 발생
-- 에러: record "new" has no field "resolved_at"

-- 1. 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS enforce_feedback_resolve_rules_trigger ON feedbacks;

-- 2. 트리거 함수 재정의 (삭제된 컬럼 참조 제거)
CREATE OR REPLACE FUNCTION enforce_feedback_resolve_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- resolved 상태로 변경 시 필수 필드 검증
  IF NEW.status = 'resolved' THEN
    -- resolution_note 필수
    IF NEW.resolution_note IS NULL OR NEW.resolution_note = '' THEN
      RAISE EXCEPTION 'resolution_note is required when status is resolved';
    END IF;
    
    -- resolved_by_user_id 필수
    IF NEW.resolved_by_user_id IS NULL THEN
      RAISE EXCEPTION 'resolved_by_user_id is required when status is resolved';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 재생성
CREATE TRIGGER enforce_feedback_resolve_rules_trigger
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION enforce_feedback_resolve_rules();

-- 참고: 위 SQL을 Supabase SQL Editor에서 실행하세요.

