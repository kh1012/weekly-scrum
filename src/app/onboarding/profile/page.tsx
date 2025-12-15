"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * 고양이 마스코트 아이콘 컴포넌트
 */
function ScrumCatIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="64" height="64" rx="16" fill="url(#catGradientOnboard)" />

      {/* Cat Face */}
      <ellipse cx="32" cy="34" rx="18" ry="16" fill="white" />

      {/* Left Ear */}
      <path d="M14 24L18 12L26 22Z" fill="white" />
      <path d="M16 21L19 14L23 20Z" fill="#FF6B9D" />

      {/* Right Ear */}
      <path d="M50 24L46 12L38 22Z" fill="white" />
      <path d="M48 21L45 14L41 20Z" fill="#FF6B9D" />

      {/* Eyes - Happy/Closed */}
      <path d="M20 30C22 28 26 28 28 30" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M36 30C38 28 42 28 44 30" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="32" cy="38" rx="2.5" ry="2" fill="#FF6B9D" />

      {/* Mouth - Happy */}
      <path
        d="M26 42C28 45 36 45 38 42"
        stroke="#1a1a2e"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Whiskers */}
      <line x1="12" y1="34" x2="20" y2="36" stroke="#1a1a2e" strokeWidth="1" strokeLinecap="round" />
      <line x1="12" y1="38" x2="20" y2="38" stroke="#1a1a2e" strokeWidth="1" strokeLinecap="round" />
      <line x1="44" y1="36" x2="52" y2="34" stroke="#1a1a2e" strokeWidth="1" strokeLinecap="round" />
      <line x1="44" y1="38" x2="52" y2="38" stroke="#1a1a2e" strokeWidth="1" strokeLinecap="round" />

      <defs>
        <linearGradient
          id="catGradientOnboard"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 배경 장식 요소
 */
function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 blur-3xl animate-pulse" />
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-violet-400/25 to-indigo-400/25 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute -bottom-32 right-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-[15%] w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 animate-float" />
      <div className="absolute top-40 right-[20%] w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 opacity-50 animate-float" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-32 left-[25%] w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-40 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-[10%] w-6 h-6 rounded-lg rotate-45 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-30 animate-float" style={{ animationDelay: "1.5s" }} />

      {/* Decorative Lines */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal-lines-onboard" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonal-lines-onboard)" />
      </svg>
    </div>
  );
}

/**
 * 프로필 온보딩 페이지
 * - 로그인 후 display name이 없는 사용자가 반드시 거치는 페이지
 * - display name 입력 후 profiles 테이블에 저장
 */
export default function OnboardingProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 빈 값 검증
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 현재 로그인된 사용자 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      // profiles 테이블에 insert
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: user.id,
        display_name: trimmedName,
        email: user.email || "",
      });

      if (insertError) {
        console.error("Profile insert error:", insertError);
        if (insertError.code === "23505") {
          // unique violation - 이미 프로필 존재
          setError("이미 프로필이 등록되어 있습니다.");
        } else {
          setError("프로필 저장에 실패했습니다. 다시 시도해주세요.");
        }
        setIsLoading(false);
        return;
      }

      // 성공 시 메인 페이지로 이동
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("예기치 않은 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <BackgroundDecoration />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Card */}
        <div
          className="relative backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/60"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.5),
              0 25px 50px -12px rgba(0, 0, 0, 0.08),
              0 12px 24px -8px rgba(16, 185, 129, 0.08)
            `,
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <ScrumCatIcon className="w-20 h-20 mx-auto drop-shadow-xl" />
              {/* Glow effect */}
              <div className="absolute inset-0 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl -z-10" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
              환영합니다! 👋
            </h1>
            <p className="mt-2 text-gray-500 text-sm font-medium">
              팀원들에게 표시될 이름을 알려주세요
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                표시 이름
              </label>
              <div
                className={`relative rounded-2xl transition-all duration-300 ${
                  isFocused
                    ? "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-white"
                    : ""
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isFocused ? "text-emerald-500" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="홍길동"
                  required
                  maxLength={50}
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-200 focus:bg-white transition-all duration-200 text-base"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 pl-1">
                이 이름은 Weekly Scrum에서 다른 팀원들에게 표시됩니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className="group relative w-full py-4 px-6 rounded-2xl text-white font-semibold text-base overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
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
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <span>시작하기</span>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 animate-fade-in bg-red-50 text-red-700 border border-red-200">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-8 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="w-8 h-1.5 rounded-full bg-gray-200" />
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            1단계: 프로필 설정
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ScrumCatIcon className="w-4 h-4" />
          <span>Weekly Scrum과 함께 시작해요</span>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
