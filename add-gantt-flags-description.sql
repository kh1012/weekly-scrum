-- Add description column to gantt_flags table
-- For multiline descriptions of flags

ALTER TABLE public.gantt_flags
ADD COLUMN IF NOT EXISTS description text NULL;

COMMENT ON COLUMN public.gantt_flags.description IS 'Flag의 상세 설명 (멀티라인 지원)';

