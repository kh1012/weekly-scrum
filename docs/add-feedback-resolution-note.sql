-- Feedback Resolution Note 추가 마이그레이션
-- resolved 처리 시 해결내용 설명을 저장

-- 1. feedbacks 테이블에 resolution_note 컬럼 추가
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS resolution_note text DEFAULT NULL;

-- 2. resolved 처리한 사용자 ID 저장 (누가 해결했는지)
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS resolved_by_user_id uuid REFERENCES auth.users(id) DEFAULT NULL;

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN feedbacks.resolution_note IS '해결 처리 시 작성한 해결내용 설명';
COMMENT ON COLUMN feedbacks.resolved_by_user_id IS 'resolved 처리한 관리자 ID';

-- 4. (선택) feedback_comments 테이블 생성 - 해결내용을 댓글 히스토리로도 관리
CREATE TABLE IF NOT EXISTS feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  comment_type text DEFAULT 'comment', -- 'comment' | 'resolution' | 'status_change'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. feedback_comments 인덱스
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_author ON feedback_comments(author_user_id);

-- 6. RLS 정책 (feedback_comments)
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 같은 워크스페이스 멤버
CREATE POLICY "feedback_comments_select" ON feedback_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM feedbacks f
    JOIN workspace_members wm ON wm.workspace_id = f.workspace_id
    WHERE f.id = feedback_comments.feedback_id
    AND wm.user_id = auth.uid()
  )
);

-- 생성: 같은 워크스페이스 멤버
CREATE POLICY "feedback_comments_insert" ON feedback_comments
FOR INSERT WITH CHECK (
  author_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM feedbacks f
    JOIN workspace_members wm ON wm.workspace_id = f.workspace_id
    WHERE f.id = feedback_comments.feedback_id
    AND wm.user_id = auth.uid()
  )
);

-- 수정: 본인 댓글만
CREATE POLICY "feedback_comments_update" ON feedback_comments
FOR UPDATE USING (author_user_id = auth.uid());

-- 삭제: 본인 댓글 또는 admin/leader
CREATE POLICY "feedback_comments_delete" ON feedback_comments
FOR DELETE USING (
  author_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM feedbacks f
    JOIN workspace_members wm ON wm.workspace_id = f.workspace_id
    WHERE f.id = feedback_comments.feedback_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('admin', 'leader')
  )
);

