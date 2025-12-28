import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 테스트용 바이패스 키 (localhost에서만 작동)
 * 사용법: ?bypass=supabase
 */
const DEV_BYPASS_KEY = "supabase";

/**
 * localhost 여부 확인
 */
function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get("host") || "";
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("0.0.0.0")
  );
}

/**
 * 미들웨어용 Supabase 클라이언트 생성
 * - 세션 갱신 처리
 * - 인증 상태 확인
 * - 프로필 완성 여부 확인
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Auth code가 있으면 /auth/callback으로 포워딩 (PKCE 흐름 처리)
  const code = request.nextUrl.searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    // 기존 searchParams 유지 (code, redirectTo 등)
    return NextResponse.redirect(url);
  }

  // 테스트용 바이패스 체크 (localhost에서만 활성화)
  const bypassKey = request.nextUrl.searchParams.get("bypass");
  const existingBypassCookie =
    request.cookies.get("dev-bypass")?.value === "true";
  const isBypassEnabled =
    isLocalhost(request) &&
    (bypassKey === DEV_BYPASS_KEY || existingBypassCookie);

  if (isBypassEnabled) {
    console.log("[DEV] Auth bypass enabled for:", request.nextUrl.pathname);
    // bypass 상태를 쿠키로 전달 (layout에서도 체크할 수 있도록)
    supabaseResponse.cookies.set("dev-bypass", "true", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60, // 1시간
      path: "/",
    });
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (만료 전 자동 갱신)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 공개 경로 (로그인 불필요)
  const publicRoutes = ["/login", "/auth/callback"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // 온보딩 경로 (로그인 필요, 프로필 불필요)
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  // 정적 파일은 제외
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (isStaticFile) {
    return supabaseResponse;
  }

  // 비로그인 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자가 로그인 페이지 접근 시 메인으로 리다이렉트
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자의 프로필 완성 여부 확인
  if (user && !isPublicRoute && !isOnboardingRoute) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[Middleware] Profile check for protected route:", {
      userId: user.id,
      profile,
      profileError: profileError?.message,
      pathname,
    });

    // 프로필 체크에 에러가 있거나 프로필이 없으면 온보딩으로 리다이렉트
    // 단, RLS 권한 에러(42501)가 아닌 경우에만
    if (!profile && (!profileError || profileError.code !== '42501')) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/profile";
      console.log("[Middleware] Redirecting to onboarding (no profile)");
      return NextResponse.redirect(url);
    }
    
    // RLS 권한 에러인 경우 일단 통과 (프로필이 있을 가능성)
    if (profileError && profileError.code === '42501') {
      console.log("[Middleware] RLS permission error, allowing access");
    }
  }

  // 이미 프로필이 있는 사용자가 온보딩 접근 시 메인으로 리다이렉트
  if (user && isOnboardingRoute) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[Middleware] Profile check for onboarding route:", {
      userId: user.id,
      profile,
      profileError: profileError?.message,
      profileErrorCode: profileError?.code,
      pathname,
    });

    // 프로필이 있으면 메인으로 리다이렉트
    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      console.log("[Middleware] Redirecting to main (profile exists)");
      return NextResponse.redirect(url);
    }
    
    // RLS 권한 에러인 경우에도 프로필이 있을 가능성이 있으므로
    // 다시 한 번 체크 (서버 사이드에서)
    if (profileError && profileError.code === '42501') {
      console.log("[Middleware] RLS permission error in onboarding, checking again...");
      // 별도 처리 없이 onboarding 진행 허용
    }
  }

  return supabaseResponse;
}
