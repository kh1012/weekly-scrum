import { createClient } from "@/lib/supabase/server";

/**
 * Workspace Role 타입
 * - admin: 관리자 (전체 데이터 관리 권한)
 * - manager: 매니저 (관리자와 동일 권한)
 * - member: 일반 멤버
 */
export type WorkspaceRole = "admin" | "manager" | "member" | null;

/**
 * 현재 로그인 유저의 workspace role을 조회 (Server Only)
 *
 * @param workspaceId - 워크스페이스 ID (기본값: DEFAULT_WORKSPACE_ID)
 * @returns role 또는 null (멤버가 아니거나 조회 실패 시)
 */
export async function getWorkspaceRole(
  workspaceId?: string
): Promise<WorkspaceRole> {
  const targetWorkspaceId = workspaceId || process.env.DEFAULT_WORKSPACE_ID;

  if (!targetWorkspaceId) {
    return null;
  }

  try {
    const supabase = await createClient();

    // 현재 로그인 유저 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // workspace_members에서 role 조회
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return null;
    }

    // Defensive fallback: "leader" → "manager" (stale cache 대응)
    let role = member.role as WorkspaceRole | "leader";
    if (role === "leader") {
      role = "manager";
    }

    return role as WorkspaceRole;
  } catch {
    return null;
  }
}

/**
 * 현재 유저가 관리자(admin 또는 manager)인지 확인
 */
export async function isAdminOrManager(workspaceId?: string): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId);
  return role === "admin" || role === "manager";
}

/**
 * isAdminOrLeader는 isAdminOrManager의 별칭 (하위 호환)
 * @deprecated isAdminOrManager 사용 권장
 */
export const isAdminOrLeader = isAdminOrManager;

/**
 * isAdminOrOwner는 isAdminOrManager의 별칭 (하위 호환)
 * @deprecated isAdminOrManager 사용 권장
 */
export const isAdminOrOwner = isAdminOrManager;

/**
 * 현재 유저의 role 정보와 함께 유저 정보도 반환
 */
export async function getWorkspaceRoleWithUser(workspaceId?: string): Promise<{
  userId: string | null;
  role: WorkspaceRole;
  displayName: string | null;
}> {
  const targetWorkspaceId = workspaceId || process.env.DEFAULT_WORKSPACE_ID;

  if (!targetWorkspaceId) {
    return { userId: null, role: null, displayName: null };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { userId: null, role: null, displayName: null };
    }

    // workspace_members에서 role 조회
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .single();

    // profiles에서 display_name 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return {
        userId: user.id,
        role: null,
        displayName: profile?.display_name || null,
      };
    }

    // Defensive fallback: "leader" → "manager" (stale cache 대응)
    let role = member.role as WorkspaceRole | "leader";
    if (role === "leader") {
      role = "manager";
    }

    return {
      userId: user.id,
      role: role as WorkspaceRole,
      displayName: profile?.display_name || null,
    };
  } catch {
    return { userId: null, role: null, displayName: null };
  }
}

