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
  heartbeatLock,
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
  extendLockIfNeeded: () => void;
  remainingSeconds: number | null;
}

const defaultLockState: LockState = {
  isLocked: false,
  isMyLock: false,
};

export function useLock({ workspaceId, onLockLost }: UseLockOptions): UseLockResult {
  const rawLockState = useDraftStore((s) => s.ui?.lockState);
  const lockState = rawLockState ?? defaultLockState;
  const setLockState = useDraftStore((s) => s.setLockState);
  const setEditing = useDraftStore((s) => s.setEditing);
  const isEditing = useDraftStore((s) => s.ui?.isEditing ?? false);

  const lockManagerRef = useRef<LockManager | null>(null);
  const cleanupBeforeUnloadRef = useRef<(() => void) | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Lock Manager 초기화
  useEffect(() => {
    const handleLockStateChange = (state: LockState) => {
      setLockState(state);
      // 락 상태와 편집 모드 동기화
      if (state.isMyLock) {
        setEditing(true);
      } else {
        setEditing(false);
      }
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

    // 초기 락 상태 조회 및 편집 모드 자동 복원
    getWorkspaceLock(workspaceId).then((state) => {
      setLockState(state);
      
      // 내 락이면 자동으로 편집 모드 활성화 + heartbeat 시작
      if (state.isMyLock) {
        setEditing(true);
        lockManagerRef.current?.startHeartbeatExternal();
        // beforeunload 핸들러 등록
        cleanupBeforeUnloadRef.current = setupBeforeUnloadHandler(workspaceId);
      } else {
        setEditing(false);
      }
    });

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

  // 마지막 연장 시간 추적 (너무 자주 호출 방지)
  const lastExtendRef = useRef<number>(0);
  const EXTEND_THRESHOLD = 300; // 5분(300초) 이하 남으면 연장
  const EXTEND_COOLDOWN = 10000; // 10초 쿨다운

  // 남은 시간이 절반 이하일 때 액션 발생 시 락 연장
  const extendLockIfNeeded = useCallback(() => {
    if (!lockState.isMyLock || remainingSeconds === null) return;

    // 절반(5분) 이상 남아있으면 연장 불필요
    if (remainingSeconds > EXTEND_THRESHOLD) return;

    // 쿨다운 확인 (너무 자주 호출 방지)
    const now = Date.now();
    if (now - lastExtendRef.current < EXTEND_COOLDOWN) return;

    lastExtendRef.current = now;

    // heartbeat 호출하여 락 연장
    heartbeatLock(workspaceId).then((result) => {
      if (result.success && result.expiresAt) {
        setLockState({
          ...lockState,
          expiresAt: result.expiresAt,
        });
      }
    });
  }, [lockState, remainingSeconds, workspaceId, setLockState]);

  // isEditing 상태를 ref로 추적 (언마운트 시 사용)
  const isEditingRef = useRef(false);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 편집 중이면 락 해제 시도
      if (isEditingRef.current) {
        releaseLock(workspaceId);
      }
      cleanupBeforeUnloadRef.current?.();
    };
  }, [workspaceId]);

  return {
    lockState,
    isMyLock: lockState.isMyLock ?? false,
    canEdit: lockState.isMyLock ?? false,
    startEditing,
    stopEditing,
    refreshLockState,
    extendLockIfNeeded,
    remainingSeconds,
  };
}

