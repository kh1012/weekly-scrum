"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
            <p className="text-sm text-gray-500 mt-2">
              팀원들에게 표시될 이름을 입력해주세요
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                이 이름은 Weekly Scrum에서 다른 팀원들에게 표시됩니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
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

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-5 p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

