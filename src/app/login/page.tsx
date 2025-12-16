"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Logo } from "@/components/weekly-scrum/common";

/**
 * PKCE 관련 에러인지 확인하고 사용자 친화적 메시지로 변환
 */
function getErrorMessage(error: string): string {
  // PKCE code verifier 오류
  if (error.includes("code verifier") || error.includes("code_verifier")) {
    return "로그인 링크를 다른 브라우저나 디바이스에서 열었습니다. 이메일 링크를 요청한 동일한 브라우저에서 열어주세요.";
  }
  // 만료된 링크
  if (error.includes("expired") || error.includes("invalid")) {
    return "로그인 링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.";
  }
  // 기타 오류는 원문 그대로
  return error;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const errorFromCallback = searchParams.get("error");

  // URL에서 전달된 에러가 있으면 표시
  useEffect(() => {
    if (errorFromCallback) {
      setMessage({
        type: "error",
        text: getErrorMessage(errorFromCallback),
      });
    }
  }, [errorFromCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${
          window.location.origin
        }/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "이메일을 확인해주세요. 로그인 링크가 발송되었습니다.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Card */}
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <Logo size={56} className="mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Weekly Scrum
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              팀의 주간 업무를 한눈에
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 px-4 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  전송 중...
                </span>
              ) : (
                "계속하기"
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-xs text-gray-400">
              비밀번호 없이 로그인
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-400">
            이메일로 발송된 링크를 클릭하면 자동으로 로그인됩니다.
          </p>
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © 2026 Weekly Scrum
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400 text-sm">로딩 중...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
