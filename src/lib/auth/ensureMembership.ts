import { SupabaseClient } from "@supabase/supabase-js";

/**
 * 로그인 직후 workspace_members에 멤버십 자동 생성
 * - 중복 실행되어도 안전 (upsert)
 * - profiles row가 없으면 생성하지 않음 (onboarding에서 처리)
 */
export async function ensureMembership(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const defaultWorkspaceId = process.env.DEFAULT_WORKSPACE_ID;

  if (!defaultWorkspaceId) {
    console.error("[ensureMembership] DEFAULT_WORKSPACE_ID is not set");
    return { success: false, error: "DEFAULT_WORKSPACE_ID not configured" };
  }

  try {
    // 1. workspace_members upsert (on conflict do nothing)
    const { error: memberError } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: defaultWorkspaceId,
          user_id: userId,
          role: "member",
        },
        {
          onConflict: "workspace_id,user_id",
          ignoreDuplicates: true,
        }
      );

    if (memberError) {
      // RLS 거부(403) 또는 FK 실패 등
      console.error("[ensureMembership] workspace_members upsert failed:", {
        code: memberError.code,
        message: memberError.message,
        details: memberError.details,
      });

      // 42501: permission denied (RLS)
      // 23503: foreign key violation
      if (memberError.code === "42501") {
        return { success: false, error: "RLS permission denied" };
      }
      if (memberError.code === "23503") {
        return { success: false, error: "Workspace not found (FK violation)" };
      }

      return { success: false, error: memberError.message };
    }

    console.log("[ensureMembership] Membership ensured for user:", userId);
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
