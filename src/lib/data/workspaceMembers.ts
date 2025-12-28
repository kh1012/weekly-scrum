/**
 * Workspace Members Data Layer
 * 
 * workspace_members 테이블과 profiles 테이블을 조인하여
 * 멤버 정보를 조회하고 관리합니다.
 */

import { createClient } from "@/lib/supabase/server";

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

  // workspace_members와 profiles를 조인하여 조회
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      user_id,
      workspace_id,
      role,
      joined_at,
      profiles:user_id (
        email,
        display_name
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("role")
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("[WorkspaceMembers] List error:", error);
    throw new Error(error.message);
  }

  // profiles 데이터를 평탄화
  return (data || []).map((member: any) => ({
    user_id: member.user_id,
    workspace_id: member.workspace_id,
    role: member.role,
    email: member.profiles?.email || null,
    display_name: member.profiles?.display_name || null,
    joined_at: member.joined_at,
  }));
}

/**
 * 멤버 role 업데이트
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

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

