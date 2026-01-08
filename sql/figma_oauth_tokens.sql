-- Figma OAuth 토큰 저장을 위한 users 테이블 확장
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

ALTER TABLE users
ADD COLUMN IF NOT EXISTS figma_encrypted_tokens TEXT,
ADD COLUMN IF NOT EXISTS figma_user_id TEXT,
ADD COLUMN IF NOT EXISTS figma_connected_at TIMESTAMPTZ;

-- 인덱스 생성 (Figma User ID로 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_users_figma_user_id ON users(figma_user_id);

-- 코멘트 추가
COMMENT ON COLUMN users.figma_encrypted_tokens IS 'AES-256-GCM으로 암호화된 Figma OAuth 토큰 (access_token, refresh_token, expires_at)';
COMMENT ON COLUMN users.figma_user_id IS 'Figma User ID (OAuth에서 반환)';
COMMENT ON COLUMN users.figma_connected_at IS 'Figma 연동 시각';

