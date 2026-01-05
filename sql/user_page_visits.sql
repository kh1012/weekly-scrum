/**
 * user_page_visits 테이블
 * 
 * 사용자의 페이지 방문 기록을 추적
 * Personal Dashboard의 Usage Metrics에 사용
 */

-- 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_workspace
    FOREIGN KEY (workspace_id)
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- 인덱스 생성
-- 1. 사용자별 최근 방문 조회용
CREATE INDEX IF NOT EXISTS idx_user_page_visits_user_created
  ON public.user_page_visits (workspace_id, user_id, created_at DESC);

-- 2. 경로별 집계용
CREATE INDEX IF NOT EXISTS idx_user_page_visits_user_path
  ON public.user_page_visits (workspace_id, user_id, path);

-- RLS 활성화
ALTER TABLE public.user_page_visits ENABLE ROW LEVEL SECURITY;

-- RLS 정책: SELECT (본인 데이터만 조회 가능)
CREATE POLICY "Users can view their own page visits"
  ON public.user_page_visits
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: INSERT (본인 데이터만 삽입 가능)
CREATE POLICY "Users can insert their own page visits"
  ON public.user_page_visits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 코멘트 추가
COMMENT ON TABLE public.user_page_visits IS '사용자 페이지 방문 기록 (Personal Dashboard Usage Metrics용)';
COMMENT ON COLUMN public.user_page_visits.workspace_id IS '워크스페이스 ID';
COMMENT ON COLUMN public.user_page_visits.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN public.user_page_visits.path IS '방문한 경로 (예: /my, /plans/gantt)';
COMMENT ON COLUMN public.user_page_visits.created_at IS '방문 시각';

