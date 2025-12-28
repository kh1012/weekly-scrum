"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureMembership } from "@/lib/auth/ensureMembership";

/**
 * 로그인 후 멤버십 확인 및 생성
 * - 클라이언트에서 세션 교환 후 호출
 */
export async function ensureUserMembership(): Promise<{
  success: boolean;
  hasProfile: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, hasProfile: false, error: "Not authenticated" };
  }

  // 멤버십 확인 및 생성
  const membershipResult = await ensureMembership(
    supabase,
    user.id,
    user.email
  );

  if (!membershipResult.success) {
    console.error(
      "[ensureUserMembership] Failed to ensure membership:",
      membershipResult.error
    );
  }

  // 프로필 존재 여부 확인 (.maybeSingle() 사용)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[ensureUserMembership] Profile check error:", profileError);
  }

  console.log("[ensureUserMembership] Profile check result:", {
    userId: user.id,
    hasProfile: !!profile,
    profileError: profileError?.message,
  });

  return {
    success: membershipResult.success,
    hasProfile: !!profile,
    error: membershipResult.error,
  };
}

















