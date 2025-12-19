-- ============================================
-- Plans 테이블에 links, description 컬럼 추가
-- ============================================

-- 1️⃣ description 컬럼 추가 (TEXT)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

COMMENT ON COLUMN plans.description IS '계획에 대한 상세 설명 (선택사항)';


-- 2️⃣ links 컬럼 추가 (JSONB 배열)
-- 형식: [{"url": "https://...", "label": "문서 링크"}, ...]
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN plans.links IS '관련 링크 목록 (선택사항). 형식: [{"url": "...", "label": "..."}]';


-- 3️⃣ 확인
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
  AND column_name IN ('description', 'links');


-- ============================================
-- 🔧 참고: 롤백이 필요한 경우
-- ============================================
/*
ALTER TABLE plans DROP COLUMN IF EXISTS description;
ALTER TABLE plans DROP COLUMN IF EXISTS links;
*/

