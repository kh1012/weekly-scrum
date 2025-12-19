-- =================================================
-- Feedback 스키마 검증 SQL
-- Supabase SQL Editor에서 실행하여 결과 확인
-- =================================================

-- =================================================
-- 1️⃣ ENUM 타입 확인
-- =================================================
SELECT 
  typname AS "ENUM 타입명",
  array_agg(enumlabel ORDER BY enumsortorder) AS "가능한 값들"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'feedback_status'
GROUP BY typname;

-- 예상 결과: feedback_status | {open,in_progress,resolved}


-- =================================================
-- 2️⃣ 테이블 존재 확인
-- =================================================
SELECT 
  table_name AS "테이블명",
  table_type AS "타입"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('feedbacks', 'releases')
ORDER BY table_name;

-- 예상 결과: feedbacks, releases 2개 테이블


-- =================================================
-- 3️⃣ feedbacks 테이블 컬럼 확인
-- =================================================
SELECT 
  column_name AS "컬럼명",
  data_type AS "데이터 타입",
  is_nullable AS "NULL 허용",
  column_default AS "기본값"
FROM information_schema.columns
WHERE table_name = 'feedbacks'
ORDER BY ordinal_position;

-- 예상 컬럼:
-- id, author_user_id, title, content, status, 
-- resolved_release_id, created_at, updated_at, resolved_at


-- =================================================
-- 4️⃣ releases 테이블 컬럼 확인
-- =================================================
SELECT 
  column_name AS "컬럼명",
  data_type AS "데이터 타입",
  is_nullable AS "NULL 허용",
  column_default AS "기본값"
FROM information_schema.columns
WHERE table_name = 'releases'
ORDER BY ordinal_position;

-- 예상 컬럼:
-- id, version, title, note, released_at, created_at


-- =================================================
-- 5️⃣ 외래키 제약조건 확인
-- =================================================
SELECT
  tc.constraint_name AS "제약조건명",
  tc.table_name AS "테이블",
  kcu.column_name AS "컬럼",
  ccu.table_name AS "참조 테이블",
  ccu.column_name AS "참조 컬럼"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'feedbacks'
ORDER BY tc.constraint_name;

-- 예상 결과:
-- author_user_id -> auth.users(id)
-- resolved_release_id -> releases(id)


-- =================================================
-- 6️⃣ 트리거 확인
-- =================================================
SELECT 
  trigger_name AS "트리거명",
  event_manipulation AS "이벤트",
  event_object_table AS "테이블",
  action_statement AS "함수"
FROM information_schema.triggers
WHERE event_object_table IN ('feedbacks', 'releases')
ORDER BY trigger_name;

-- 예상 결과:
-- feedbacks_updated_at (UPDATE)
-- feedbacks_resolve_rules (UPDATE)


-- =================================================
-- 7️⃣ RLS 활성화 확인
-- =================================================
SELECT 
  schemaname AS "스키마",
  tablename AS "테이블명",
  rowsecurity AS "RLS 활성화"
FROM pg_tables
WHERE tablename IN ('feedbacks', 'releases')
  AND schemaname = 'public'
ORDER BY tablename;

-- 예상 결과: 모두 true


-- =================================================
-- 8️⃣ RLS 정책 확인
-- =================================================
SELECT 
  schemaname AS "스키마",
  tablename AS "테이블",
  policyname AS "정책명",
  cmd AS "명령",
  CASE 
    WHEN roles = '{public}' THEN 'public'
    ELSE array_to_string(roles, ', ')
  END AS "역할"
FROM pg_policies
WHERE tablename IN ('feedbacks', 'releases')
ORDER BY tablename, policyname;

-- 예상 정책 (feedbacks):
-- - member_select_own_feedback (SELECT)
-- - member_insert_feedback (INSERT)
-- - member_update_own_feedback (UPDATE)
-- - member_delete_own_feedback (DELETE)
-- - leader_admin_full_access_feedback (ALL)

-- 예상 정책 (releases):
-- - releases_select_all (SELECT)
-- - releases_admin_full_access (ALL)


-- =================================================
-- 9️⃣ 인덱스 확인
-- =================================================
SELECT
  schemaname AS "스키마",
  tablename AS "테이블",
  indexname AS "인덱스명",
  indexdef AS "정의"
FROM pg_indexes
WHERE tablename = 'feedbacks'
  AND schemaname = 'public'
ORDER BY indexname;

-- 예상 인덱스:
-- idx_feedbacks_author
-- idx_feedbacks_status
-- idx_feedbacks_created_at


-- =================================================
-- 🔟 전체 요약
-- =================================================
SELECT 
  'ENUM 타입' AS "항목",
  COUNT(DISTINCT typname)::TEXT AS "개수"
FROM pg_type
WHERE typname = 'feedback_status'

UNION ALL

SELECT 
  '테이블',
  COUNT(*)::TEXT
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('feedbacks', 'releases')

UNION ALL

SELECT 
  '트리거',
  COUNT(*)::TEXT
FROM information_schema.triggers
WHERE event_object_table = 'feedbacks'

UNION ALL

SELECT 
  'RLS 정책 (feedbacks)',
  COUNT(*)::TEXT
FROM pg_policies
WHERE tablename = 'feedbacks'

UNION ALL

SELECT 
  'RLS 정책 (releases)',
  COUNT(*)::TEXT
FROM pg_policies
WHERE tablename = 'releases'

UNION ALL

SELECT 
  '인덱스 (feedbacks)',
  COUNT(*)::TEXT
FROM pg_indexes
WHERE tablename = 'feedbacks'
  AND schemaname = 'public'
  AND indexname LIKE 'idx_%';


-- =================================================
-- ⚠️ 문제 진단: 누락된 항목 찾기
-- =================================================

-- ENUM이 없는 경우
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
    RAISE NOTICE '❌ feedback_status ENUM이 생성되지 않았습니다!';
  ELSE
    RAISE NOTICE '✅ feedback_status ENUM 정상';
  END IF;
END $$;

-- 테이블이 없는 경우
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedbacks') THEN
    RAISE NOTICE '❌ feedbacks 테이블이 생성되지 않았습니다!';
  ELSE
    RAISE NOTICE '✅ feedbacks 테이블 정상';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'releases') THEN
    RAISE NOTICE '❌ releases 테이블이 생성되지 않았습니다!';
  ELSE
    RAISE NOTICE '✅ releases 테이블 정상';
  END IF;
END $$;

-- RLS가 활성화되지 않은 경우
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'feedbacks' 
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE '❌ feedbacks 테이블의 RLS가 활성화되지 않았습니다!';
  ELSE
    RAISE NOTICE '✅ feedbacks RLS 활성화 정상';
  END IF;
END $$;


-- =================================================
-- 🧪 기능 테스트 (선택사항)
-- =================================================

-- 테스트 데이터 삽입 (본인 계정으로만 가능)
/*
-- 1. 테스트 피드백 생성
INSERT INTO feedbacks (author_user_id, title, content, status)
VALUES (
  auth.uid(),
  'Test Feedback',
  'This is a test feedback content',
  'open'
);

-- 2. 생성된 피드백 확인
SELECT 
  id,
  title,
  content,
  status,
  created_at
FROM feedbacks
WHERE author_user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- 3. 상태 변경 테스트 (open -> in_progress)
UPDATE feedbacks
SET status = 'in_progress'
WHERE author_user_id = auth.uid()
  AND status = 'open'
RETURNING id, status, updated_at;

-- 4. 트리거 검증: updated_at이 자동으로 갱신되었는지 확인
SELECT 
  id,
  status,
  created_at,
  updated_at,
  updated_at > created_at AS "updated_at_갱신됨"
FROM feedbacks
WHERE author_user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- 5. 테스트 데이터 삭제
DELETE FROM feedbacks
WHERE author_user_id = auth.uid()
  AND title = 'Test Feedback';
*/

