/**
 * Lock 관리 Hook
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useDraftStore } from "./store";
import {
  LockManager,
  getWorkspaceLock,
  releaseLock,
  setupBeforeUnloadHandler,
} from "./lockService";
import type { LockState } from "./types";

interface UseLockOptions {
  workspaceId: string;
  onLockLost?: () => void;
}

interface UseLockResult {
  lockState: LockState;
  isMyLock: boolean;
  canEdit: boolean;
  startEditing: () => Promise<boolean>;
  stopEditing: () => Promise<void>;
  refreshLockState: () => Promise<void>;
  remainingSeconds: number | null;
}

export function useLock({ workspaceId, onLockLost }: UseLockOptions): UseLockResult {
  const lockState = useDraftStore((s) => s.ui.lockState);
  const setLockState = useDraftStore((s) => s.setLockState);
  const setEditing = useDraftStore((s) => s.setEditing);
  const isEditing = useDraftStore((s) => s.ui.isEditing);

  const lockManagerRef = useRef<LockManager | null>(null);
  const cleanupBeforeUnloadRef = useRef<(() => void) | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Lock Manager 초기화
  useEffect(() => {
    const handleLockStateChange = (state: LockState) => {
      setLockState(state);
    };

    const handleLockLost = () => {
      setEditing(false);
      onLockLost?.();
    };

    lockManagerRef.current = new LockManager(
      workspaceId,
      handleLockStateChange,
      handleLockLost
    );

    // 초기 락 상태 조회
    getWorkspaceLock(workspaceId).then(setLockState);

    return () => {
      lockManagerRef.current?.cleanup();
    };
  }, [workspaceId, setLockState, setEditing, onLockLost]);

  // 남은 시간 계산
  useEffect(() => {
    if (!lockState.isMyLock || !lockState.expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const expires = new Date(lockState.expiresAt!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setRemainingSeconds(remaining);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);

    return () => clearInterval(timer);
  }, [lockState.isMyLock, lockState.expiresAt]);

  // 편집 시작
  const startEditing = useCallback(async (): Promise<boolean> => {
    if (!lockManagerRef.current) return false;

    const success = await lockManagerRef.current.acquire();

    if (success) {
      setEditing(true);
      // beforeunload 핸들러 등록
      cleanupBeforeUnloadRef.current = setupBeforeUnloadHandler(workspaceId);
    }

    return success;
  }, [workspaceId, setEditing]);

  // 편집 종료
  const stopEditing = useCallback(async (): Promise<void> => {
    if (!lockManagerRef.current) return;

    await lockManagerRef.current.release();
    setEditing(false);

    // beforeunload 핸들러 정리
    cleanupBeforeUnloadRef.current?.();
    cleanupBeforeUnloadRef.current = null;
  }, [setEditing]);

  // 락 상태 새로고침
  const refreshLockState = useCallback(async (): Promise<void> => {
    const state = await getWorkspaceLock(workspaceId);
    setLockState(state);
  }, [workspaceId, setLockState]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 편집 중이면 락 해제 시도
      if (isEditing) {
        releaseLock(workspaceId);
      }
      cleanupBeforeUnloadRef.current?.();
    };
  }, [isEditing, workspaceId]);

  return {
    lockState,
    isMyLock: lockState.isMyLock ?? false,
    canEdit: lockState.isMyLock ?? false,
    startEditing,
    stopEditing,
    refreshLockState,
    remainingSeconds,
  };
}

