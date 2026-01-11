import { createClient } from "@/lib/supabase/server";

/**
 * profiles.basic_role enum
 */
export type BasicRole = "PLANNING" | "FE" | "BE" | "DESIGN" | "QA";

/**
 * 워크스페이스 멤버 정보
 */
export interface WorkspaceMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: "admin" | "manager" | "member";
  /** 프로필에 설정된 기본 역할 (담당자 role 초기값으로 사용) */
  basic_role: BasicRole | null;
}

/**
 * 워크스페이스 멤버 목록 조회
 * - workspace_members와 profiles를 별도로 조회 후 조합
 * - 담당자 선택 옵션용
 */
export async function listWorkspaceMembers({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<WorkspaceMember[]> {
  const supabase = await createClient();

  try {
    // 1. workspace_members 조회
    const { data: members, error: membersError } = await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", workspaceId)
      .order("role", { ascending: true });

    if (membersError) {
      console.error(
        "[listWorkspaceMembers] Failed to fetch members:",
        {
          error: membersError,
          workspaceId,
          message: membersError.message,
          details: membersError.details,
          hint: membersError.hint,
          code: membersError.code,
        }
      );
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    // 2. 각 멤버의 user_id로 profiles 조회
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, basic_role")
      .in("user_id", userIds);

    if (profilesError) {
      console.error(
        "[listWorkspaceMembers] Failed to fetch profiles:",
        {
          error: profilesError,
          userIds,
          message: profilesError.message,
        }
      );
    }

    // 3. 데이터 병합
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const result = members.map((member) => {
      const profile = profileMap.get(member.user_id);
      
      // 빈 문자열도 null 처리
      const displayName = profile?.display_name?.trim() || null;
      const email = profile?.email?.trim() || null;

      // Defensive fallback: "leader" → "manager"
      let role = member.role as "admin" | "manager" | "member" | "leader";
      if (role === "leader") {
        role = "manager";
      }

      return {
        user_id: member.user_id,
        display_name: displayName,
        email: email,
        role: role as "admin" | "manager" | "member",
        basic_role: (profile?.basic_role as BasicRole | null) || null,
      };
    });

    return result;
  } catch (err) {
    console.error("[listWorkspaceMembers] Unexpected error:", err);
    return [];
  }
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
  const members = await listWorkspaceMembers({ workspaceId });
  const lowerQuery = query.toLowerCase();

  return members.filter((member) => {
    const name = member.display_name?.toLowerCase() || "";
    const email = member.email?.toLowerCase() || "";
    return name.includes(lowerQuery) || email.includes(lowerQuery);
  });
}

// Re-exports for consolidated access
export * from "./profiles";
export { 
  listWorkspaceMembers as listWorkspaceMembersLegacy, 
  updateMemberRole,
  updateMemberProfile,
  removeMember,
  type WorkspaceMember as WorkspaceMemberLegacy
} from "./workspaceMembers";
