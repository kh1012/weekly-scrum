/**
 * 활성 워크스페이스 ID를 관리하는 훅
 * - demo 모드: 고정 DEMO_WORKSPACE_ID 반환
 * - prod 모드: localStorage에서 선택된 workspace_id 반환
 */

import { useState, useEffect } from "react";
import {
  getActiveWorkspaceId,
  setActiveWorkspaceId as saveWorkspaceId,
  clearActiveWorkspaceId,
  isDemoMode,
} from "@/lib/supabase/mode";

export interface UseActiveWorkspaceReturn {
  workspaceId: string | null;
  isDemo: boolean;
  setWorkspaceId: (id: string) => void;
  clearWorkspaceId: () => void;
}

/**
 * 활성 워크스페이스 ID를 관리하는 커스텀 훅
 */
export function useActiveWorkspace(): UseActiveWorkspaceReturn {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const isDemo = isDemoMode();

  useEffect(() => {
    // 초기 로드 시 workspace ID 가져오기
    const id = getActiveWorkspaceId();
    setWorkspaceIdState(id);

    // localStorage 변경 감지 (다른 탭에서 변경된 경우)
    const handleStorageChange = () => {
      const updatedId = getActiveWorkspaceId();
      setWorkspaceIdState(updatedId);
    };

    if (!isDemo) {
      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [isDemo]);

  const setWorkspaceId = (id: string) => {
    saveWorkspaceId(id);
    setWorkspaceIdState(id);
  };

  const clearWorkspaceId = () => {
    clearActiveWorkspaceId();
    setWorkspaceIdState(null);
  };

  return {
    workspaceId,
    isDemo,
    setWorkspaceId,
    clearWorkspaceId,
  };
}
