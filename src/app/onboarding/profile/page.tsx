"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * Weekly Scrum 로고 - Popcorn/Ice cream 스타일
 */
function WeeklyScrumLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="64" height="64" rx="12" fill="#F76D57"/>
      
      {/* Popcorn/Ice cream top (cream color) */}
      <g transform="translate(3, 2) scale(0.9)">
        <path fill="#F9EBB2" d="M56,13.998c-1.237,0-2.387-0.375-3.343-1.018c-0.671-0.451-1.242-1.037-1.685-1.715
          c-0.055,0.82-0.352,1.564-0.825,2.174c-0.731,0.941-1.862,1.559-3.147,1.559c-0.839,0-1.616-0.262-2.26-0.703
          c-0.594-0.408-1.065-0.975-1.369-1.635c-0.328,0.658-0.772,1.248-1.309,1.742c-1.069,0.988-2.493,1.596-4.062,1.596
          c-1.583,0-3.02-0.619-4.092-1.619c-0.498-0.467-0.917-1.014-1.233-1.625c-0.429,0.533-0.948,0.986-1.532,1.348
          c-0.915,0.564-1.989,0.896-3.143,0.896c-2.048,0-3.854-1.029-4.937-2.596c-0.412-0.596-0.715-1.27-0.89-1.994
          c-0.437,0.572-1.015,1.027-1.693,1.299c-0.459,0.184-0.956,0.291-1.48,0.291c-2.209,0-4-1.791-4-4s1.791-4,4-4
          c0.839,0,1.616,0.26,2.26,0.703c0.594,0.406,1.065,0.975,1.369,1.637c0.327-0.662,0.771-1.25,1.308-1.746
          C25.006,3.605,26.431,2.998,28,2.998c1.583,0,3.02,0.617,4.092,1.619c0.498,0.467,0.917,1.014,1.233,1.623
          c0.429-0.531,0.948-0.986,1.532-1.348C35.772,4.328,36.846,3.998,38,3.998c0.445,0,0.878,0.053,1.296,0.145
          c0.675,0.148,1.305,0.412,1.873,0.768c0.188-0.66,0.524-1.26,0.996-1.732c0.725-0.729,1.727-1.18,2.835-1.18
          c1.729,0,3.188,1.104,3.747,2.641c0.08,0.221,0.145,0.449,0.185,0.684c0.503,0.17,0.978,0.402,1.41,0.693
          c0.143-0.406,0.326-0.791,0.548-1.15c1.056-1.719,2.946-2.867,5.11-2.867c3.313,0,6,2.686,6,6C62,11.311,59.313,13.998,56,13.998z"/>
      </g>
      
      {/* Container base (coral) */}
      <rect x="16" y="22" width="32" height="38" rx="3" fill="#F76D57"/>
      
      {/* Container lines (dark) */}
      <line x1="26" y1="24" x2="26" y2="56" stroke="#394240" strokeWidth="2"/>
      <line x1="32" y1="24" x2="32" y2="56" stroke="#394240" strokeWidth="2"/>
      <line x1="38" y1="24" x2="38" y2="56" stroke="#394240" strokeWidth="2"/>
    </svg>
  );
}

/**
 * 프로필 온보딩 페이지
 */
export default function OnboardingProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: user.id,
        display_name: trimmedName,
        email: user.email || "",
      });

      if (insertError) {
        console.error("Profile insert error:", insertError);
        if (insertError.code === "23505") {
          setError("이미 프로필이 등록되어 있습니다.");
        } else {
          setError("프로필 저장에 실패했습니다. 다시 시도해주세요.");
        }
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("예기치 않은 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Card */}
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <WeeklyScrumLogo className="w-14 h-14 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">
              프로필 설정
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              팀원들에게 표시될 이름을 입력해주세요
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                표시 이름
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="홍길동"
                required
                maxLength={50}
                autoFocus
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
              <p className="mt-1 text-xs text-gray-400">
                이 이름은 Weekly Scrum에서 다른 팀원들에게 표시됩니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
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
                  저장 중...
                </span>
              ) : (
                "시작하기"
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {/* Progress */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-8 h-1 rounded-full bg-rose-500" />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">1단계 / 2단계</p>
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © 2024 Weekly Scrum
        </p>
      </div>
    </div>
  );
}
