/**
 * Workspace Members Data Layer
 * 
 * workspace_members 테이블과 profiles 테이블을 조인하여
 * 멤버 정보를 조회하고 관리합니다.
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

/**
 * Service role client (bypasses RLS)
 * Admin/Manager가 다른 멤버의 role을 업데이트할 때 사용
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  role: string;
  email: string | null;
  display_name: string | null;
  joined_at: string;
}

/**
 * 워크스페이스 멤버 목록 조회
 */
export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const supabase = await createClient();

  // 1. workspace_members 조회
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id, workspace_id, role, joined_at")
    .eq("workspace_id", workspaceId)
    .order("role")
    .order("joined_at", { ascending: false });

  if (membersError) {
    console.error("[WorkspaceMembers] List error:", membersError);
    throw new Error(membersError.message);
  }

  if (!members || members.length === 0) {
    return [];
  }

  // 2. 각 멤버의 user_id로 profiles 조회
  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, email, display_name")
    .in("user_id", userIds);

  if (profilesError) {
    console.error("[WorkspaceMembers] Profiles error:", profilesError);
    // profiles 조회 실패 시에도 멤버 정보는 반환 (email, display_name만 null)
  }

  // 3. 데이터 병합
  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p])
  );

  return members.map((member) => {
    const profile = profileMap.get(member.user_id);
    return {
      user_id: member.user_id,
      workspace_id: member.workspace_id,
      role: member.role,
      email: profile?.email || null,
      display_name: profile?.display_name || null,
      joined_at: member.joined_at,
    };
  });
}

/**
 * 멤버 role 업데이트
 * Service role을 사용하여 RLS 우회 (Admin/Manager 권한 체크는 액션에서 수행)
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  // Service role client 사용 (RLS 우회)
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    console.error("[WorkspaceMembers] Update role error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 멤버 프로필 업데이트 (display_name)
 */
export async function updateMemberProfile(
  userId: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("user_id", userId);

  if (error) {
    console.error("[WorkspaceMembers] Update profile error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 멤버 삭제 (워크스페이스에서 제거)
 */
export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    console.error("[WorkspaceMembers] Delete error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

