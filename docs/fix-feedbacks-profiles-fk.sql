-- ============================================
-- Feedbacks와 Profiles 관계 수정
-- ============================================
-- 문제: feedbacks.author_user_id → auth.users (기존)
-- 해결: feedbacks.author_user_id → profiles.user_id (수정)

-- 1. 기존 FK 제거
ALTER TABLE feedbacks 
DROP CONSTRAINT IF EXISTS feedbacks_author_user_id_fkey;

-- 2. profiles로 FK 재생성
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_author_user_id_fkey 
FOREIGN KEY (author_user_id) 
REFERENCES profiles(user_id) 
ON DELETE CASCADE;

-- 3. 검증
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'feedbacks'
  AND kcu.column_name = 'author_user_id';

-- 예상 결과:
-- constraint_name: feedbacks_author_user_id_fkey
-- table_name: feedbacks
-- column_name: author_user_id
-- foreign_table_name: profiles
-- foreign_column_name: user_id
-- delete_rule: CASCADE

