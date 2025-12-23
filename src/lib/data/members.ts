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
  role: "admin" | "leader" | "member";
  /** 프로필에 설정된 기본 역할 (담당자 role 초기값으로 사용) */
  basic_role: BasicRole | null;
}

/**
 * 워크스페이스 멤버 목록 조회
 * - workspace_members 조회 후 profiles 별도 조회
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
        membersError
      );
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    // 2. profiles 별도 조회 (basic_role 포함)
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, basic_role")
      .in("user_id", userIds);

    if (profilesError) {
      console.error(
        "[listWorkspaceMembers] Failed to fetch profiles:",
        profilesError
      );
      // profiles 없어도 멤버 목록은 반환
    }

    // 3. 조합
    const profileMap = new Map<
      string,
      {
        display_name: string | null;
        email: string | null;
        basic_role: BasicRole | null;
      }
    >();
    for (const p of profiles || []) {
      profileMap.set(p.user_id, {
        display_name: p.display_name,
        email: p.email,
        basic_role: p.basic_role as BasicRole | null,
      });
    }

    const result = members.map((member) => {
      const profile = profileMap.get(member.user_id);
      // 빈 문자열도 null 처리
      const displayName = profile?.display_name?.trim() || null;
      const email = profile?.email?.trim() || null;
      return {
        user_id: member.user_id,
        display_name: displayName,
        email: email,
        role: member.role as "admin" | "leader" | "member",
        basic_role: profile?.basic_role || null,
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
