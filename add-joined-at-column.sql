-- workspace_members 테이블에 joined_at 컬럼 추가 (선택사항)
-- 
-- 이 스크립트는 선택적으로 실행할 수 있습니다.
-- 멤버의 가입 시점을 추적하고 싶다면 실행하세요.

BEGIN;

-- joined_at 컬럼 추가 (기본값: 현재 시간)
ALTER TABLE public.workspace_members
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기존 레코드에 대해 created_at이 있다면 그 값을 사용, 없으면 현재 시간
UPDATE public.workspace_members
SET joined_at = COALESCE(created_at, NOW())
WHERE joined_at IS NULL;

COMMIT;

-- 참고:
-- 이 컬럼을 추가하면 Members 관리 페이지에서 가입일을 확인할 수 있습니다.
-- 현재는 User ID(앞 8자리)를 표시하고 있습니다.

