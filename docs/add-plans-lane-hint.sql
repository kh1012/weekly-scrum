-- Plans 테이블에 lane_hint 컬럼 추가
-- 사용자가 수동으로 배치한 레인 위치를 저장

ALTER TABLE "public"."plans"
ADD COLUMN IF NOT EXISTS "lane_hint" integer;

COMMENT ON COLUMN "public"."plans"."lane_hint" IS '사용자가 수동으로 지정한 레인 인덱스 (0-based)';

