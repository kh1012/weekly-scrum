"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { ensureUserMembership } from "@/app/actions/auth";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * Auth 콜백 내부 컴포넌트
 * useSearchParams를 사용하므로 Suspense로 감싸야 함
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const redirectTo = searchParams.get("redirectTo") || "/";

      const supabase = createClient();

      // 1. 이미 세션이 있는지 먼저 확인 (자동 처리된 경우)
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession) {
        // 이미 로그인된 상태 - 바로 진행
        const { hasProfile } = await ensureUserMembership();
        if (!hasProfile) {
          router.replace("/onboarding/profile");
          return;
        }
        router.replace(redirectTo);
        return;
      }

      // 2. code가 없으면 로그인 페이지로
      if (!code) {
        router.replace("/login");
        return;
      }

      // 3. code 교환 시도 (로컬스토리지의 code_verifier 사용)
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // 에러가 나도 세션이 생겼을 수 있음 (race condition)
        const {
          data: { session: newSession },
        } = await supabase.auth.getSession();

        if (newSession) {
          // 세션이 있으면 정상 진행
          const { hasProfile } = await ensureUserMembership();
          if (!hasProfile) {
            router.replace("/onboarding/profile");
            return;
          }
          router.replace(redirectTo);
          return;
        }

        // 진짜 에러인 경우
        console.error("Auth callback error:", error);
        setError(error.message);
        setTimeout(() => {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        }, 2000);
        return;
      }

      // 4. 성공 - 멤버십 확인 및 생성 (서버 액션)
      const { hasProfile } = await ensureUserMembership();

      if (!hasProfile) {
        router.replace("/onboarding/profile");
        return;
      }

      router.replace(redirectTo);
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-2">인증 오류</div>
          <div className="text-sm text-gray-500">{error}</div>
          <div className="text-xs text-gray-400 mt-2">
            로그인 페이지로 이동합니다...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoLoadingSpinner
        title="인증 처리 중입니다"
        description="잠시만 기다려주세요."
        className="min-h-screen"
      />
    </div>
  );
}

/**
 * Auth 콜백 로딩 Fallback
 */
function AuthCallbackFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LogoLoadingSpinner
        title="로딩 중..."
        description=""
        className="min-h-screen"
      />
    </div>
  );
}

/**
 * Supabase Auth 콜백 페이지 (클라이언트 사이드)
 * - PKCE 흐름을 위해 클라이언트에서 code 교환 처리
 * - 브라우저 로컬스토리지의 code_verifier 사용
 * - useSearchParams 사용을 위해 Suspense boundary 필요
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
