"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/auth/auth-helpers";
import { isDemoMode } from "@/lib/supabase/mode";
import { Logo } from "@/components/weekly-scrum/common";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(true);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const errorFromCallback = searchParams.get("error");
  const isDemo = isDemoMode();

  // URL에서 전달된 에러가 있으면 표시
  useEffect(() => {
    if (errorFromCallback) {
      setMessage({
        type: "error",
        text: getErrorMessage(errorFromCallback),
      });
    }
  }, [errorFromCallback]);

  // 탭 전환 핸들러 (순차적 애니메이션)
  const handleModeChange = (newMode: "login" | "signup") => {
    if (newMode === mode) return;

    setMessage(null);
    setIsFadingIn(false);

    // 로고 회전 시작 (독립적으로 750ms 동안 실행)
    setIsLogoSpinning(true);
    setTimeout(() => {
      setIsLogoSpinning(false);
    }, 750);

    // 1단계: 페이드 아웃 (150ms)
    setIsTransitioning(true);

    // 2단계: 페이드 아웃 완료 후 모드 변경 (높이 변화 시작)
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);

      // 3단계: 높이 변화가 시작된 후 페이드 인 시작
      setTimeout(() => {
        setIsFadingIn(true);
      }, 50);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    let result;

    if (isDemo) {
      // Demo 모드: 로그인 또는 회원가입
      if (mode === "signup") {
        result = await signUpWithPassword(email, password, displayName);

        if (result.success) {
          setMessage({
            type: "success",
            text: result.message || "회원가입이 완료되었습니다.",
          });
          // 회원가입 성공 → 로그인 모드로 전환
          setMode("login");
          setPassword("");
          setDisplayName("");
        }
      } else {
        result = await signInWithPassword(email, password);

        if (result.success) {
          // 로그인 성공 → 메인 페이지로 이동
          router.push(redirectTo);
        }
      }
    } else {
      // Production 모드: Magic Link
      result = await signInWithMagicLink(email, redirectTo);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "이메일을 확인해주세요.",
        });
      }
    }

    setIsLoading(false);

    if (!result.success) {
      setMessage({
        type: "error",
        text: result.error || "오류가 발생했습니다.",
      });
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = await signInWithPassword("demo-admin@example.com", "1234");

    setIsLoading(false);

    if (result.success) {
      router.push(redirectTo);
    } else {
      setMessage({
        type: "error",
        text: result.error || "게스트 로그인에 실패했습니다.",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8"
      style={{ backgroundColor: "#f6f8fa" }}
    >
      {/* Demo 환경 토스트 메시지 */}
      {isDemo && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 px-4 py-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: "#0969da",
            color: "#ffffff",
            border: "1px solid #0550ae",
          }}
        >
          <p className="text-sm text-center whitespace-pre-line leading-relaxed">
            데모 환경에서는 Continue as Guest 버튼을 통해 바로 접속할 수
            있습니다.{"\n"}
            또한, 회원가입을 통해 새로 가입하여 환경을 둘러볼 수 있습니다.
          </p>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md mx-4">
        <div
          className="bg-white rounded-lg border overflow-hidden"
          style={{ borderColor: "#d0d7de" }}
        >
          {/* Logo & Title */}
          <div className="text-center px-6 pt-6 pb-4">
            <div
              className="mx-auto mb-4 inline-block"
              style={{
                transform: isLogoSpinning ? "rotate(360deg)" : "rotate(0deg)",
                transition: isLogoSpinning
                  ? "transform 750ms cubic-bezier(0.25, 0.1, 0.25, 1)"
                  : "transform 0ms",
              }}
            >
              <Logo size={52} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#24292f" }}>
              Weekly Scrum {isDemo ? "Demo" : ""}
            </h1>
            <p className="mt-1.5 text-xs" style={{ color: "#57606a" }}>
              팀의 주간 업무를 한눈에
            </p>
          </div>

          {/* Demo 모드: 로그인/회원가입 탭 */}
          {isDemo && (
            <div className="px-6">
              <div className="flex relative">
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className="flex-1 py-3 text-sm font-medium transition-colors relative z-10"
                  style={{
                    color: mode === "login" ? "#24292f" : "#57606a",
                  }}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("signup")}
                  className="flex-1 py-3 text-sm font-medium transition-colors relative z-10"
                  style={{
                    color: mode === "signup" ? "#24292f" : "#57606a",
                  }}
                >
                  회원가입
                </button>
                {/* 슬라이딩 언더라인 - Airbnb 스타일 */}
                <span
                  className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: "#24292f",
                    width: "50%",
                    left: mode === "login" ? "0%" : "50%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Form - 순차적 페이드 & 높이 애니메이션 적용 */}
          <div className="overflow-hidden transition-all duration-[250ms] ease-in-out">
            <form
              onSubmit={handleSubmit}
              className="px-6 py-4 space-y-3"
              style={{
                opacity: isTransitioning ? 0 : isFadingIn ? 1 : 0,
                transform: isTransitioning
                  ? "scale(1)"
                  : isFadingIn
                  ? "scale(1)"
                  : "scale(0.95)",
                transition: isTransitioning
                  ? "opacity 150ms ease-out"
                  : "opacity 200ms ease-in, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {isDemo && mode === "signup" && (
                <div>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 rounded-md text-sm transition-all focus:outline-none"
                    style={{
                      border: "1px solid #d0d7de",
                      color: "#24292f",
                      backgroundColor: "#ffffff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0969da";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(9, 105, 218, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d7de";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              )}

              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-3 py-2 rounded-md text-sm transition-all focus:outline-none"
                  style={{
                    border: "1px solid #d0d7de",
                    color: "#24292f",
                    backgroundColor: "#ffffff",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0969da";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(9, 105, 218, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d0d7de";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {isDemo && (
                <div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 rounded-md text-sm transition-all focus:outline-none"
                    style={{
                      border: "1px solid #d0d7de",
                      color: "#24292f",
                      backgroundColor: "#ffffff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0969da";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(9, 105, 218, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d7de";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading || !email.trim() || (isDemo && !password.trim())
                }
                className="w-full py-2 px-4 rounded-md text-white text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: "#24292f",
                  border: "1px solid rgba(27, 31, 36, 0.15)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#1b1f23";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#24292f";
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    {isDemo
                      ? mode === "signup"
                        ? "가입 중..."
                        : "로그인 중..."
                      : "전송 중..."}
                  </span>
                ) : isDemo ? (
                  mode === "signup" ? (
                    "회원가입"
                  ) : (
                    "로그인"
                  )
                ) : (
                  "계속하기"
                )}
              </button>
            </form>
          </div>

          {/* 절취선 (Demo 모드 전용) */}
          {isDemo && (
            <div className="px-6 py-3">
              <div className="flex items-center">
                <div
                  className="flex-1 border-t border-dashed"
                  style={{ borderColor: "#d0d7de" }}
                />
                <span className="px-3 text-xs" style={{ color: "#8c959f" }}>
                  또는
                </span>
                <div
                  className="flex-1 border-t border-dashed"
                  style={{ borderColor: "#d0d7de" }}
                />
              </div>
            </div>
          )}

          {/* 게스트 모드 버튼 (Demo 모드 전용) */}
          {isDemo && (
            <div className="px-6 pb-4">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: "#f6f8fa",
                  color: "#24292f",
                  border: "1px solid #d0d7de",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#1b1f23";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f6f8fa";
                  e.currentTarget.style.borderColor = "#d0d7de";
                }}
              >
                Continue as Guest
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="px-6 pb-4">
              <div
                className="p-2.5 rounded-md text-xs"
                style={
                  message.type === "success"
                    ? {
                        backgroundColor: "#dafbe1",
                        color: "#1a7f37",
                        border: "1px solid #4ac776",
                      }
                    : {
                        backgroundColor: "#ffebe9",
                        color: "#cf222e",
                        border: "1px solid #ff8182",
                      }
                }
              >
                {message.text}
              </div>
            </div>
          )}

          {!isDemo && (
            <div className="px-6 pb-4">
              {/* Divider */}
              <div className="mt-4 flex items-center">
                <div
                  className="flex-1"
                  style={{ borderTop: "1px solid #d0d7de" }}
                />
                <span className="px-3 text-xs" style={{ color: "#57606a" }}>
                  비밀번호 없이 로그인
                </span>
                <div
                  className="flex-1"
                  style={{ borderTop: "1px solid #d0d7de" }}
                />
              </div>

              {/* Footer */}
              <p
                className="mt-3 text-center text-xs"
                style={{ color: "#57606a" }}
              >
                이메일로 발송된 링크를 클릭하면 자동으로 로그인됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Bottom text */}
        <p className="mt-4 text-center text-xs" style={{ color: "#57606a" }}>
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
        <LogoLoadingSpinner
          title="로딩 중..."
          description=""
          className="min-h-screen bg-gray-50"
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
