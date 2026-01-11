-- Foreign Key 추가로 Supabase PostgREST JOIN 활성화
-- 이 스크립트를 실행하면 profiles!left, profiles!author_id 같은 JOIN이 작동합니다

-- 1. workspace_members -> profiles FK 추가
-- user_id가 profiles 테이블의 user_id를 참조
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- 2. snapshots -> profiles FK 추가 (author_id)
-- author_id가 profiles 테이블의 user_id를 참조
ALTER TABLE snapshots
ADD CONSTRAINT fk_snapshots_author_id
FOREIGN KEY (author_id)
REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 3. plan_assignees -> profiles FK 추가
-- user_id가 profiles 테이블의 user_id를 참조
ALTER TABLE plan_assignees
ADD CONSTRAINT fk_plan_assignees_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- 4. PostgREST 스키마 캐시 새로고침
-- Supabase Studio에서 "Reload schema cache" 또는
-- 아래 명령어 실행 (Supabase CLI)
-- curl -X POST 'https://<project-ref>.supabase.co/rest/v1/rpc/reload_schema_cache' \
--   -H "apikey: <anon-key>" \
--   -H "Authorization: Bearer <anon-key>"

-- FK 확인 쿼리
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table_name,
  af.attname AS foreign_column_name
FROM pg_constraint AS c
JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid::regclass::text IN ('workspace_members', 'snapshots', 'plan_assignees')
ORDER BY table_name, constraint_name;
