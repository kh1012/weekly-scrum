import { SupabaseClient } from "@supabase/supabase-js";

/**
 * 로그인 직후 workspace_members에 멤버십 자동 생성
 * - 중복 실행되어도 안전 (이미 존재하면 스킵)
 * - profiles row가 없으면 생성하지 않음 (onboarding에서 처리)
 */
export async function ensureMembership(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const defaultWorkspaceId = process.env.DEFAULT_WORKSPACE_ID;

  console.log("[ensureMembership] Starting...", {
    userId,
    userEmail,
    defaultWorkspaceId: defaultWorkspaceId ? "set" : "NOT SET",
  });

  if (!defaultWorkspaceId) {
    console.error("[ensureMembership] DEFAULT_WORKSPACE_ID is not set");
    return { success: false, error: "DEFAULT_WORKSPACE_ID not configured" };
  }

  try {
    // 1. 이미 멤버인지 확인
    const { data: existingMember, error: selectError } = await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", defaultWorkspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      console.error("[ensureMembership] Select failed:", {
        code: selectError.code,
        message: selectError.message,
      });
    }

    if (existingMember) {
      console.log("[ensureMembership] Already a member:", existingMember);
      return { success: true };
    }

    // 2. 새로 멤버 등록
    console.log("[ensureMembership] Inserting new member...");
    const { data: insertData, error: insertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: defaultWorkspaceId,
        user_id: userId,
        role: "member",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[ensureMembership] Insert failed:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });

      // 23505: unique violation (이미 존재) - 이건 성공으로 처리
      if (insertError.code === "23505") {
        console.log("[ensureMembership] Already exists (unique violation)");
        return { success: true };
      }

      // 42501: permission denied (RLS)
      if (insertError.code === "42501") {
        return { success: false, error: "RLS permission denied" };
      }

      // 23503: foreign key violation
      if (insertError.code === "23503") {
        return { success: false, error: "Workspace not found (FK violation)" };
      }

      return { success: false, error: insertError.message };
    }

    console.log("[ensureMembership] Member created successfully:", insertData);
    return { success: true };
  } catch (err) {
    console.error("[ensureMembership] Unexpected error:", err);
    return { success: false, error: "Unexpected error" };
  }
}

/**
 * 프로필 존재 여부 확인
 */
export async function hasProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  return !!data;
}
