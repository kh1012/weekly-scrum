import { createClient } from "@/lib/supabase/server";
import { ensureMembership, hasProfile } from "@/lib/auth/ensureMembership";
import { NextResponse } from "next/server";

/**
 * Supabase Auth 콜백 라우트
 * - Email OTP 인증 완료 처리
 * - 첫 로그인 시 workspace_members 자동 생성 (upsert)
 * - 프로필 미완성 시 온보딩으로 리다이렉트
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    const supabase = await createClient();

    // 인증 코드로 세션 교환
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (user) {
      // 1. workspace_members 자동 생성 (upsert - 중복 안전)
      const membershipResult = await ensureMembership(
        supabase,
        user.id,
        user.email
      );

      if (!membershipResult.success) {
        console.error(
          "[Auth Callback] Failed to ensure membership:",
          membershipResult.error
        );
        // 멤버십 생성 실패해도 일단 진행 (RLS 에러는 나중에 발생)
      }

      // 2. 프로필 존재 여부 확인
      const profileExists = await hasProfile(supabase, user.id);

      // 프로필이 없으면 온보딩으로 리다이렉트
      if (!profileExists) {
        return NextResponse.redirect(`${origin}/onboarding/profile`);
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // 코드가 없으면 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`);
}

