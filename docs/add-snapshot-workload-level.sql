-- Snapshot Workload Level 추가 마이그레이션
-- 이번 주 작업 부담 수준을 스냅샷 단위(주 1회)로 기록

-- 1. ENUM 타입 생성 (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'snapshot_workload_level') THEN
    CREATE TYPE public.snapshot_workload_level AS ENUM ('light', 'normal', 'burden');
  END IF;
END $$;

-- 2. snapshots 테이블에 컬럼 추가
ALTER TABLE snapshots
ADD COLUMN IF NOT EXISTS workload_level public.snapshot_workload_level DEFAULT NULL;

ALTER TABLE snapshots
ADD COLUMN IF NOT EXISTS workload_note text DEFAULT NULL;

ALTER TABLE snapshots
ADD COLUMN IF NOT EXISTS workload_updated_at timestamptz DEFAULT NULL;

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN snapshots.workload_level IS '이번 주 작업 부담 수준 (light: 여유, normal: 적정, burden: 부담)';
COMMENT ON COLUMN snapshots.workload_note IS '작업 부담 관련 한 줄 메모 (선택 입력)';
COMMENT ON COLUMN snapshots.workload_updated_at IS 'workload 값 변경 시점';

