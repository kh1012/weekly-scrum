/**
 * 앱 모드 관리 유틸리티
 * - demo: 데모 모드 (로그인 불필요, 고정 workspace 사용)
 * - prod: 프로덕션 모드 (로그인 필요, workspace 선택)
 */

// Workspace ID 상수 (fallback 값으로 사용)
export const PROD_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000002";
export const WORKSPACE_ID_KEY = "selected_workspace_id";

/**
 * 현재 앱 모드 확인
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_MODE === "demo";
}

/**
 * 현재 모드에 맞는 기본 workspace ID 가져오기
 * 환경변수 NEXT_PUBLIC_DEFAULT_WORKSPACE_ID를 우선 사용하고,
 * 없으면 모드별 fallback 값 사용
 */
export function getDefaultWorkspaceId(): string {
  const envWorkspaceId = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID;

  if (envWorkspaceId) {
    return envWorkspaceId;
  }

  // 환경변수가 없으면 fallback 값 사용
  return isDemoMode() ? DEMO_WORKSPACE_ID : PROD_WORKSPACE_ID;
}

/**
 * 활성 workspace ID 가져오기
 * - demo 모드: getDefaultWorkspaceId() 반환 (환경변수 우선)
 * - prod 모드: localStorage에서 선택된 workspace_id 반환
 */
export function getActiveWorkspaceId(): string | null {
  if (isDemoMode()) {
    return getDefaultWorkspaceId();
  }

  // 브라우저 환경에서만 localStorage 접근
  if (typeof window !== "undefined") {
    return localStorage.getItem(WORKSPACE_ID_KEY);
  }

  return null;
}

/**
 * Workspace ID 저장 (prod 모드 전용)
 */
export function setActiveWorkspaceId(workspaceId: string): void {
  if (isDemoMode()) {
    console.warn("Demo 모드에서는 workspace를 변경할 수 없습니다.");
    return;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
  }
}

/**
 * Workspace ID 제거 (로그아웃 시 사용)
 */
export function clearActiveWorkspaceId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WORKSPACE_ID_KEY);
  }
}
