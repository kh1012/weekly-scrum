"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * Weekly Scrum 로고 - 라인 스타일
 */
function WeeklyScrumLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar/Sprint icon */}
      <rect
        x="8"
        y="12"
        width="32"
        height="28"
        rx="3"
        stroke="#FF385C"
        strokeWidth="2"
        fill="none"
      />
      <line x1="8" y1="20" x2="40" y2="20" stroke="#FF385C" strokeWidth="2" />
      <line
        x1="16"
        y1="6"
        x2="16"
        y2="14"
        stroke="#FF385C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="6"
        x2="32"
        y2="14"
        stroke="#FF385C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Checkmark */}
      <path
        d="M15 30L21 36L33 24"
        stroke="#FF385C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
