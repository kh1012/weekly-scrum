-- gantt_flags 테이블에 lane_hint 컬럼 추가
-- 사용자가 명시적으로 지정한 레인 인덱스를 저장하기 위함

ALTER TABLE gantt_flags
ADD COLUMN IF NOT EXISTS lane_hint INTEGER DEFAULT NULL;

-- 컬럼 설명 추가
COMMENT ON COLUMN gantt_flags.lane_hint IS '사용자가 명시적으로 지정한 레인 인덱스 (빈 레인 이동 시 설정됨)';

