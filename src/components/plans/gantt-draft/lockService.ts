/**
 * Workspace Lock Service
 * - 편집 시작 시 락 획득
 * - heartbeat로 락 유지
 * - 페이지 이탈/저장 완료 시 락 해제
 */

import { createClient } from "@/lib/supabase/browser";
import type { LockState } from "./types";

const DEFAULT_TTL_SECONDS = 600; // 10분 TTL
const HEARTBEAT_INTERVAL = 30000; // 30초마다 heartbeat (더 자주)
const HEARTBEAT_RETRY_COUNT = 2; // heartbeat 실패 시 재시도 횟수
const HEARTBEAT_RETRY_DELAY = 3000; // 재시도 간격 (3초)

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

    const currentUserId = userData.user.id;

    // 먼저 현재 락 상태 확인
    const currentState = await getWorkspaceLock(workspaceId);
    console.log("[tryAcquireLock] 현재 락 상태:", currentState);

    // 이미 내 락이면 heartbeat로 갱신하고 성공 반환
    if (currentState.isMyLock) {
      console.log("[tryAcquireLock] 이미 내 락, heartbeat로 갱신");
      const heartbeatResult = await heartbeatLock(workspaceId, ttlSeconds);
      if (heartbeatResult.success) {
        return {
          success: true,
          lockState: {
            ...currentState,
            expiresAt: heartbeatResult.expiresAt || currentState.expiresAt,
          },
        };
      }
    }

    const { data, error } = await supabase.rpc("try_acquire_workspace_lock", {
      p_workspace_id: workspaceId,
      p_ttl_seconds: ttlSeconds,
    });

    if (error) {
      console.error("[tryAcquireLock] RPC error:", error);
      return { success: false, lockState: currentState };
    }

    // RPC가 배열로 반환하는 경우 처리
    const result = Array.isArray(data) ? data[0] : data;
    console.log("[tryAcquireLock] RPC 결과:", result);

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

    // 락 획득 실패 - 현재 상태 반환
    console.warn("[tryAcquireLock] 락 획득 실패, 현재 홀더:", currentState.lockedByName);
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
    
    console.log("[heartbeatLock] Raw result:", result);

    // success 필드가 명시적으로 있는지 확인
    // result가 null/undefined이거나 success가 false인 경우에만 실패
    const isSuccess = result?.success === true;
    
    return {
      success: isSuccess,
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
 * 재시도 로직이 포함된 heartbeat
 */
async function heartbeatWithRetry(
  workspaceId: string,
  retryCount: number = HEARTBEAT_RETRY_COUNT
): Promise<{ success: boolean; expiresAt?: string }> {
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const result = await heartbeatLock(workspaceId);
    
    if (result.success) {
      return result;
    }
    
    if (attempt < retryCount) {
      console.log(`[heartbeatWithRetry] 재시도 ${attempt + 1}/${retryCount}...`);
      await new Promise((resolve) => setTimeout(resolve, HEARTBEAT_RETRY_DELAY));
    }
  }
  
  return { success: false };
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
  private visibilityHandler: (() => void) | null = null;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

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
      this.consecutiveFailures = 0;
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
    this.removeVisibilityHandler();
    this.isActive = false;
    this.consecutiveFailures = 0;

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

      console.log("[LockManager] Heartbeat 시도...");
      const result = await heartbeatWithRetry(this.workspaceId);
      console.log("[LockManager] Heartbeat 결과:", result);

      if (result.success) {
        this.consecutiveFailures = 0;
        // 성공 시 만료 시간 업데이트 (expiresAt이 있는 경우에만)
        if (result.expiresAt) {
          this.onLockStateChange({
            isLocked: true,
            isMyLock: true,
            expiresAt: result.expiresAt,
          });
        }
        console.log("[LockManager] Heartbeat 성공, 락 유지");
      } else {
        this.consecutiveFailures++;
        console.warn(`[LockManager] Heartbeat 실패 (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES})`);
        
        // 연속 실패 횟수가 임계치를 넘으면 락 상실 처리
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          console.error("[LockManager] 연속 heartbeat 실패, 락 상실 처리 및 서버 락 해제");
          this.isActive = false;
          this.stopHeartbeat();
          this.removeVisibilityHandler();
          
          // 서버의 락도 해제 시도 (동기화)
          await releaseLock(this.workspaceId);
          
          this.onLockStateChange({ isLocked: false, isMyLock: false });
          this.onLockLost();
        }
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
    // 기존 핸들러 제거
    this.removeVisibilityHandler();
    
    this.visibilityHandler = async () => {
      if (document.visibilityState === "visible" && this.isActive) {
        // 탭이 다시 활성화되면 heartbeat 갱신
        console.log("[LockManager] Visibility 변경, heartbeat 시도...");
        const result = await heartbeatWithRetry(this.workspaceId);
        console.log("[LockManager] Visibility heartbeat 결과:", result);
        
        if (result.success) {
          this.consecutiveFailures = 0;
          // 성공 시 만료 시간 업데이트 (expiresAt이 있는 경우에만)
          if (result.expiresAt) {
            this.onLockStateChange({
              isLocked: true,
              isMyLock: true,
              expiresAt: result.expiresAt,
            });
          }
          console.log("[LockManager] Visibility heartbeat 성공, 락 유지");
        } else {
          console.warn("[LockManager] Visibility heartbeat 실패, 락 상실");
          this.isActive = false;
          this.stopHeartbeat();
          this.removeVisibilityHandler();
          
          // 서버의 락도 해제 시도 (동기화)
          await releaseLock(this.workspaceId);
          
          this.onLockStateChange({ isLocked: false, isMyLock: false });
          this.onLockLost();
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
  }
  
  /**
   * Visibility change 핸들러 제거
   */
  private removeVisibilityHandler(): void {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  /**
   * 외부에서 heartbeat 시작 (페이지 새로고침 후 락 복원 시)
   */
  startHeartbeatExternal(): void {
    this.isActive = true;
    this.consecutiveFailures = 0;
    this.startHeartbeat();
    this.setupVisibilityHandler();
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.stopHeartbeat();
    this.removeVisibilityHandler();
    this.isActive = false;
    this.consecutiveFailures = 0;
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

