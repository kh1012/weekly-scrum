import { createClient } from "@/lib/supabase/server";

/**
 * 워크스페이스 멤버 정보
 */
export interface WorkspaceMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: "admin" | "leader" | "member";
}

/**
 * 워크스페이스 멤버 목록 조회
 * - workspace_members JOIN profiles
 * - 담당자 선택 옵션용
 */
export async function listWorkspaceMembers({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<WorkspaceMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      user_id,
      role,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("role", { ascending: true });

  if (error) {
    console.error("[listWorkspaceMembers] Failed:", error);
    throw error;
  }

  interface MemberRow {
    user_id: string;
    role: string;
    profiles: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null;
  }

  return ((data || []) as MemberRow[]).map((member) => {
    // profiles는 단일 객체 또는 배열일 수 있음
    const profileData = member.profiles;
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;
    return {
      user_id: member.user_id,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      role: member.role as "admin" | "leader" | "member",
    };
  });
}

/**
 * 워크스페이스 멤버 검색 (이름 또는 이메일)
 */
export async function searchWorkspaceMembers({
  workspaceId,
  query,
}: {
  workspaceId: string;
  query: string;
}): Promise<WorkspaceMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      user_id,
      role,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("[searchWorkspaceMembers] Failed:", error);
    throw error;
  }

  const lowerQuery = query.toLowerCase();

  interface MemberRow {
    user_id: string;
    role: string;
    profiles: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null;
  }

  return ((data || []) as MemberRow[])
    .map((member) => {
      const profileData = member.profiles;
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      return {
        user_id: member.user_id,
        display_name: profile?.display_name || null,
        email: profile?.email || null,
        role: member.role as "admin" | "leader" | "member",
      };
    })
    .filter((member) => {
      const name = member.display_name?.toLowerCase() || "";
      const email = member.email?.toLowerCase() || "";
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });
}

