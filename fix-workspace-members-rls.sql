-- workspace_members 테이블 RLS 정책 확인 및 수정
-- Admin이 다른 멤버의 role을 업데이트할 수 있도록 허용

BEGIN;

-- 기존 UPDATE 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'workspace_members'
  AND cmd = 'UPDATE';

-- Admin/Manager가 같은 워크스페이스 내 멤버의 role을 업데이트할 수 있도록 정책 추가
-- 기존 정책이 있다면 DROP하고 재생성

DROP POLICY IF EXISTS "workspace_members_update_admin" ON public.workspace_members;

CREATE POLICY "workspace_members_update_admin"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  -- 같은 워크스페이스의 Admin 또는 Manager만 가능
  EXISTS (
    SELECT 1 
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  -- 업데이트 후에도 같은 워크스페이스의 Admin/Manager여야 함
  EXISTS (
    SELECT 1 
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('admin', 'manager')
  )
);

COMMIT;

-- 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'workspace_members'
ORDER BY cmd, policyname;

