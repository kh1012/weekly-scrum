import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth 콜백 라우트
 * - Email OTP 인증 완료 처리
 * - 첫 로그인 시 workspace_members 자동 생성
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    const supabase = await createClient();

    // 인증 코드로 세션 교환
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (user) {
      // 첫 로그인 시 DEFAULT_WORKSPACE_ID에 멤버로 등록
      const defaultWorkspaceId = process.env.DEFAULT_WORKSPACE_ID;

      if (defaultWorkspaceId) {
        // 이미 멤버인지 확인
        const { data: existingMember } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", defaultWorkspaceId)
          .eq("user_id", user.id)
          .single();

        if (!existingMember) {
          // 멤버 등록 (insert - RLS에서 중복 방지)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: memberError } = await (supabase as any)
            .from("workspace_members")
            .insert({
              workspace_id: defaultWorkspaceId,
              user_id: user.id,
              role: "member",
            });

          if (memberError) {
            console.error("Failed to create workspace member:", memberError);
          } else {
            console.log(`Created workspace member for user ${user.id}`);
          }
        }
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // 코드가 없으면 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`);
}

