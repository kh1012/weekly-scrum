"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * 사자 마스코트 아이콘 컴포넌트 (행복한 표정)
 */
function ScrumLionIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="64" height="64" rx="16" fill="url(#lionGradientOnboard)" />

      {/* Mane - Outer */}
      <circle cx="32" cy="32" r="24" fill="#F59E0B" />

      {/* Mane spikes */}
      <path d="M32 8C34 12 36 14 32 18C28 14 30 12 32 8Z" fill="#D97706" />
      <path d="M44 12C42 16 42 18 38 18C40 14 42 14 44 12Z" fill="#D97706" />
      <path d="M20 12C22 16 22 18 26 18C24 14 22 14 20 12Z" fill="#D97706" />
      <path d="M52 20C48 20 46 22 46 26C48 24 50 22 52 20Z" fill="#D97706" />
      <path d="M12 20C16 20 18 22 18 26C16 24 14 22 12 20Z" fill="#D97706" />
      <path d="M56 32C52 32 50 32 48 36C52 34 54 34 56 32Z" fill="#D97706" />
      <path d="M8 32C12 32 14 32 16 36C12 34 10 34 8 32Z" fill="#D97706" />

      {/* Face */}
      <ellipse cx="32" cy="34" rx="18" ry="16" fill="#FCD34D" />

      {/* Ears */}
      <ellipse cx="18" cy="20" rx="5" ry="4" fill="#FCD34D" />
      <ellipse cx="18" cy="20" rx="3" ry="2" fill="#FBBF24" />
      <ellipse cx="46" cy="20" rx="5" ry="4" fill="#FCD34D" />
      <ellipse cx="46" cy="20" rx="3" ry="2" fill="#FBBF24" />

      {/* Eyes - Happy/Closed */}
      <path d="M21 30C23 28 27 28 29 30" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M35 30C37 28 41 28 43 30" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <path d="M32 35L28 40L36 40Z" fill="#92400E" />

      {/* Mouth - Big smile */}
      <path
        d="M24 43C28 48 36 48 40 43"
        stroke="#92400E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Whisker dots */}
      <circle cx="22" cy="38" r="1" fill="#92400E" />
      <circle cx="19" cy="37" r="1" fill="#92400E" />
      <circle cx="42" cy="38" r="1" fill="#92400E" />
      <circle cx="45" cy="37" r="1" fill="#92400E" />

      <defs>
        <linearGradient
          id="lionGradientOnboard"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 정글 배경 장식 요소
 */
function JungleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900" />

      {/* Misty overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-emerald-900/30 to-emerald-950/50" />

      {/* Animated light rays */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-yellow-300/40 via-yellow-200/10 to-transparent transform -skew-x-12 animate-ray" />
        <div className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-yellow-200/30 via-yellow-100/5 to-transparent transform skew-x-6 animate-ray" style={{ animationDelay: "2s" }} />
        <div className="absolute top-0 right-1/4 w-20 h-full bg-gradient-to-b from-amber-200/25 via-amber-100/5 to-transparent transform -skew-x-6 animate-ray" style={{ animationDelay: "4s" }} />
      </div>

      {/* Tropical leaves - Top */}
      <svg className="absolute -top-20 -left-20 w-80 h-80 text-emerald-700 animate-sway" viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 10C100 10 60 50 50 100C40 150 80 180 100 190C120 180 160 150 150 100C140 50 100 10 100 10Z" opacity="0.6" />
        <path d="M100 20C100 20 70 55 62 100C54 145 85 170 100 178C115 170 146 145 138 100C130 55 100 20 100 20Z" fill="currentColor" opacity="0.8" />
        <path d="M100 10L100 190" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
      </svg>

      <svg className="absolute -top-10 -right-32 w-96 h-96 text-emerald-600 animate-sway-reverse" viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 10C100 10 60 50 50 100C40 150 80 180 100 190C120 180 160 150 150 100C140 50 100 10 100 10Z" opacity="0.5" />
      </svg>

      {/* Palm fronds */}
      <svg className="absolute top-10 left-10 w-64 h-64 text-green-600 animate-sway" style={{ animationDelay: "0.5s" }} viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 90C50 90 20 60 15 40C10 20 30 10 50 5C70 10 90 20 85 40C80 60 50 90 50 90Z" opacity="0.7" />
      </svg>

      <svg className="absolute top-20 right-20 w-48 h-48 text-teal-600 animate-sway-reverse" style={{ animationDelay: "1s" }} viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 90C50 90 20 60 15 40C10 20 30 10 50 5C70 10 90 20 85 40C80 60 50 90 50 90Z" opacity="0.6" />
      </svg>

      {/* Bottom leaves */}
      <svg className="absolute -bottom-20 -left-10 w-72 h-72 text-emerald-800 animate-sway" style={{ animationDelay: "1.5s" }} viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 190C100 190 140 150 150 100C160 50 120 20 100 10C80 20 40 50 50 100C60 150 100 190 100 190Z" opacity="0.8" />
      </svg>

      <svg className="absolute -bottom-32 -right-20 w-96 h-96 text-green-700 animate-sway-reverse" style={{ animationDelay: "2s" }} viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 190C100 190 140 150 150 100C160 50 120 20 100 10C80 20 40 50 50 100C60 150 100 190 100 190Z" opacity="0.7" />
      </svg>

      {/* Hanging vines */}
      <svg className="absolute top-0 left-1/3 w-8 h-64 animate-swing" viewBox="0 0 20 150" fill="none">
        <path d="M10 0C10 0 5 30 10 50C15 70 5 90 10 110C15 130 10 150 10 150" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        <circle cx="10" cy="50" r="4" fill="#22c55e" />
        <circle cx="10" cy="90" r="3" fill="#22c55e" />
        <circle cx="10" cy="130" r="5" fill="#22c55e" />
      </svg>

      <svg className="absolute top-0 right-1/4 w-6 h-48 animate-swing" style={{ animationDelay: "1s" }} viewBox="0 0 20 120" fill="none">
        <path d="M10 0C10 0 15 25 10 45C5 65 15 85 10 105C5 115 10 120 10 120" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="45" r="3" fill="#16a34a" />
        <circle cx="10" cy="85" r="4" fill="#16a34a" />
      </svg>

      {/* Fireflies / Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-yellow-300 animate-firefly opacity-60" />
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-yellow-200 animate-firefly" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-amber-300 animate-firefly" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 right-1/4 w-1 h-1 rounded-full bg-yellow-100 animate-firefly" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-1/4 right-1/2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-firefly" style={{ animationDelay: "0.5s" }} />
      <div className="absolute top-2/3 left-1/5 w-2 h-2 rounded-full bg-amber-200 animate-firefly" style={{ animationDelay: "2.5s" }} />

      {/* Monstera leaves */}
      <svg className="absolute bottom-10 left-20 w-32 h-32 text-emerald-700 animate-sway" style={{ animationDelay: "0.8s" }} viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 95C50 95 20 70 15 45C10 20 40 5 50 5C60 5 90 20 85 45C80 70 50 95 50 95Z" opacity="0.8" />
        <ellipse cx="35" cy="40" rx="8" ry="12" fill="#065f46" opacity="0.5" />
        <ellipse cx="65" cy="40" rx="8" ry="12" fill="#065f46" opacity="0.5" />
      </svg>

      {/* Fern */}
      <svg className="absolute bottom-20 right-10 w-40 h-40 text-green-600 animate-sway-reverse" style={{ animationDelay: "1.2s" }} viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 90L50 30" stroke="currentColor" strokeWidth="2" />
        <circle cx="30" cy="25" r="4" opacity="0.7" />
        <circle cx="70" cy="25" r="4" opacity="0.7" />
        <circle cx="25" cy="38" r="3" opacity="0.7" />
        <circle cx="75" cy="38" r="3" opacity="0.7" />
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
    <div className="min-h-screen relative flex items-center justify-center">
      <JungleBackground />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Card */}
        <div
          className="relative backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.3),
              0 25px 50px -12px rgba(0, 0, 0, 0.4),
              0 12px 24px -8px rgba(5, 150, 105, 0.2)
            `,
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <ScrumLionIcon className="w-24 h-24 mx-auto drop-shadow-2xl" />
              {/* Glow effect */}
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-30 blur-xl -z-10 animate-pulse" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 bg-clip-text text-transparent tracking-tight">
              환영합니다! 🎉
            </h1>
            <p className="mt-2 text-gray-600 text-sm font-medium">
              🌿 정글의 왕처럼 프로젝트를 이끌어보세요
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
                    ? "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-white"
                    : ""
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isFocused ? "text-amber-600" : "text-gray-400"
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-200 focus:bg-white transition-all duration-200 text-base"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 pl-1">
                이 이름은 Weekly Scrum에서 다른 팀원들에게 표시됩니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className="group relative w-full py-4 px-6 rounded-2xl text-white font-semibold text-base overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
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
                    <span>🦁 정글로 출발!</span>
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
            <div className="w-8 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="w-8 h-1.5 rounded-full bg-gray-200" />
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            1단계: 프로필 설정
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/80">
          <ScrumLionIcon className="w-5 h-5" />
          <span>Weekly Scrum과 함께 정글을 탐험해요</span>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes sway {
          0%, 100% {
            transform: rotate(-3deg) translateX(0);
          }
          50% {
            transform: rotate(3deg) translateX(5px);
          }
        }
        
        @keyframes sway-reverse {
          0%, 100% {
            transform: rotate(3deg) translateX(0);
          }
          50% {
            transform: rotate(-3deg) translateX(-5px);
          }
        }
        
        @keyframes swing {
          0%, 100% {
            transform: rotate(-5deg);
            transform-origin: top center;
          }
          50% {
            transform: rotate(5deg);
            transform-origin: top center;
          }
        }
        
        @keyframes firefly {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(0) translateX(0);
          }
          25% {
            opacity: 0.8;
            transform: translateY(-10px) translateX(5px);
          }
          50% {
            opacity: 0.4;
            transform: translateY(-5px) translateX(-5px);
          }
          75% {
            opacity: 0.9;
            transform: translateY(-15px) translateX(3px);
          }
        }
        
        @keyframes ray {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .animate-sway {
          animation: sway 8s ease-in-out infinite;
        }
        
        .animate-sway-reverse {
          animation: sway-reverse 7s ease-in-out infinite;
        }
        
        .animate-swing {
          animation: swing 4s ease-in-out infinite;
        }
        
        .animate-firefly {
          animation: firefly 5s ease-in-out infinite;
        }
        
        .animate-ray {
          animation: ray 6s ease-in-out infinite;
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
