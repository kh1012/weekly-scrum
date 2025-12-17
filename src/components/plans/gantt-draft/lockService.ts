/**
 * Workspace Lock Service
 * - 편집 시작 시 락 획득
 * - heartbeat로 락 유지
 * - 페이지 이탈/저장 완료 시 락 해제
 */

import { createClient } from "@/lib/supabase/browser";
import type { LockState } from "./types";

const DEFAULT_TTL_SECONDS = 600; // 10분 TTL
const HEARTBEAT_INTERVAL = 60000; // 1분마다 heartbeat

/**
 * Lock 상태 조회
 */
export async function getWorkspaceLock(workspaceId: string): Promise<LockState> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_workspace_lock", {
      p_workspace_id: workspaceId,
    });

    if (error) {
      console.error("[getWorkspaceLock] RPC error:", error);
      return { isLocked: false };
    }

    // RPC가 배열로 반환하는 경우 처리
    const result = Array.isArray(data) ? data[0] : data;

    // 결과가 없거나 holder_user_id가 없으면 락 없음
    if (!result || !result.holder_user_id) {
      return { isLocked: false };
    }

    // 현재 사용자 확인
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;

    return {
      isLocked: true,
      lockedBy: result.holder_user_id,
      lockedByName: result.holder_display_name || result.holder_user_id,
      expiresAt: result.expires_at,
      isMyLock: currentUserId === result.holder_user_id,
    };
  } catch (err) {
    console.error("[getWorkspaceLock] Error:", err);
    return { isLocked: false };
  }
}

/**
 * 락 획득 시도
 */
export async function tryAcquireLock(
  workspaceId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<{ success: boolean; lockState: LockState }> {
  const supabase = createClient();

  try {
    // 먼저 사용자 인증 상태 확인
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("[tryAcquireLock] 인증 오류:", userError);
      return { success: false, lockState: { isLocked: false } };
    }

    const { data, error } = await supabase.rpc("try_acquire_workspace_lock", {
      p_workspace_id: workspaceId,
      p_ttl_seconds: ttlSeconds,
    });

    if (error) {
      console.error("[tryAcquireLock] RPC error:", error);
      // 락 실패 시 현재 상태 조회
      const currentState = await getWorkspaceLock(workspaceId);
      return { success: false, lockState: currentState };
    }

    // RPC가 배열로 반환하는 경우 처리
    const result = Array.isArray(data) ? data[0] : data;

    // RPC는 ok: true/false를 반환함
    if (result?.ok) {
      return {
        success: true,
        lockState: {
          isLocked: true,
          isMyLock: true,
          lockedBy: result.holder_user_id,
          lockedByName: result.holder_display_name,
          expiresAt: result.expires_at,
        },
      };
    }

    // 락 획득 실패 - 누가 잡고 있는지 확인
    const currentState = await getWorkspaceLock(workspaceId);
    return { success: false, lockState: currentState };
  } catch (err) {
    console.error("[tryAcquireLock] Error:", err);
    return { success: false, lockState: { isLocked: false } };
  }
}

/**
 * 락 heartbeat (갱신)
 */
export async function heartbeatLock(
  workspaceId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<{ success: boolean; expiresAt?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("heartbeat_workspace_lock", {
      p_workspace_id: workspaceId,
      p_ttl_seconds: ttlSeconds,
    });

    if (error) {
      console.error("[heartbeatLock] RPC error:", error);
      return { success: false };
    }

    // RPC가 배열로 반환하는 경우 처리
    const result = Array.isArray(data) ? data[0] : data;

    return {
      success: result?.success ?? false,
      expiresAt: result?.expires_at,
    };
  } catch (err) {
    console.error("[heartbeatLock] Error:", err);
    return { success: false };
  }
}

/**
 * 락 해제
 */
export async function releaseLock(workspaceId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("release_workspace_lock", {
      p_workspace_id: workspaceId,
    });

    if (error) {
      console.error("[releaseLock] RPC error:", error);
      return false;
    }

    // RPC가 배열로 반환하는 경우 처리
    const result = Array.isArray(data) ? data[0] : data;

    return result?.released ?? false;
  } catch (err) {
    console.error("[releaseLock] Error:", err);
    return false;
  }
}

/**
 * Lock Manager Hook
 * - 락 획득/해제/heartbeat 관리
 * - visibility change 감지
 */
export class LockManager {
  private workspaceId: string;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private onLockStateChange: (state: LockState) => void;
  private onLockLost: () => void;
  private isActive = false;

  constructor(
    workspaceId: string,
    onLockStateChange: (state: LockState) => void,
    onLockLost: () => void
  ) {
    this.workspaceId = workspaceId;
    this.onLockStateChange = onLockStateChange;
    this.onLockLost = onLockLost;
  }

  /**
   * 락 획득 시도
   */
  async acquire(): Promise<boolean> {
    const result = await tryAcquireLock(this.workspaceId);
    this.onLockStateChange(result.lockState);

    if (result.success) {
      this.isActive = true;
      this.startHeartbeat();
      this.setupVisibilityHandler();
      return true;
    }

    return false;
  }

  /**
   * 락 해제
   */
  async release(): Promise<void> {
    this.stopHeartbeat();
    this.isActive = false;

    await releaseLock(this.workspaceId);
    this.onLockStateChange({ isLocked: false, isMyLock: false });
  }

  /**
   * 현재 락 상태 폴링
   */
  async poll(): Promise<LockState> {
    const state = await getWorkspaceLock(this.workspaceId);
    this.onLockStateChange(state);
    return state;
  }

  /**
   * Heartbeat 시작
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(async () => {
      if (!this.isActive) {
        this.stopHeartbeat();
        return;
      }

      const result = await heartbeatLock(this.workspaceId);

      if (!result.success) {
        // 락 상실
        this.isActive = false;
        this.stopHeartbeat();
        this.onLockStateChange({ isLocked: false, isMyLock: false });
        this.onLockLost();
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Heartbeat 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Visibility change 핸들러 설정
   */
  private setupVisibilityHandler(): void {
    const handler = async () => {
      if (document.visibilityState === "visible" && this.isActive) {
        // 탭이 다시 활성화되면 heartbeat 갱신
        const result = await heartbeatLock(this.workspaceId);
        if (!result.success) {
          this.isActive = false;
          this.stopHeartbeat();
          this.onLockStateChange({ isLocked: false, isMyLock: false });
          this.onLockLost();
        }
      }
    };

    document.addEventListener("visibilitychange", handler);
  }

  /**
   * 외부에서 heartbeat 시작 (페이지 새로고침 후 락 복원 시)
   */
  startHeartbeatExternal(): void {
    this.isActive = true;
    this.startHeartbeat();
    this.setupVisibilityHandler();
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.stopHeartbeat();
    this.isActive = false;
  }

  /**
   * 활성 상태 확인
   */
  get active(): boolean {
    return this.isActive;
  }
}

/**
 * beforeunload 핸들러 등록 (페이지 이탈 시 락 해제 시도)
 */
export function setupBeforeUnloadHandler(workspaceId: string): () => void {
  const handler = () => {
    // sendBeacon으로 락 해제 시도 (비동기 불가능하므로 best-effort)
    const supabase = createClient();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/release_workspace_lock`;

    navigator.sendBeacon(
      url,
      JSON.stringify({ p_workspace_id: workspaceId })
    );
  };

  window.addEventListener("beforeunload", handler);

  return () => {
    window.removeEventListener("beforeunload", handler);
  };
}

