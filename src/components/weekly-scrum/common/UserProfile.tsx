"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface UserInfo {
  email: string;
  displayName: string;
  snapshotCount: number;
}

/**
 * 사용자 프로필 컴포넌트
 * - GNB 우측에 표시되는 프로필 아이콘
 * - 클릭 시 팝오버로 사용자 정보 표시
 */
export function UserProfile() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 사용자 정보 로드
  const loadUserInfo = useCallback(async () => {
    try {
      const supabase = createClient();

      // 현재 사용자 정보
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserInfo(null);
        setIsLoading(false);
        return;
      }

      // 프로필 정보 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setUserInfo(null);
        setIsLoading(false);
        return;
      }

      // 작성한 스냅샷 개수 가져오기 (display_name으로 매칭)
      const { count } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("name", profile.display_name);

      setUserInfo({
        email: profile.email || user.email || "",
        displayName: profile.display_name,
        snapshotCount: count || 0,
      });
    } catch (error) {
      console.error("Failed to load user info:", error);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // 로딩 중이거나 사용자 정보가 없으면 표시하지 않음
  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--notion-bg-secondary)" }} />
    );
  }

  if (!userInfo) {
    return null;
  }

  // 이니셜 생성 (첫 글자)
  const initial = userInfo.displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={popoverRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:scale-105"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          fontWeight: 600,
          fontSize: "14px",
          boxShadow: isOpen
            ? "0 4px 12px rgba(99, 102, 241, 0.4)"
            : "0 2px 8px rgba(99, 102, 241, 0.3)",
        }}
        title={userInfo.displayName}
      >
        {initial}
      </button>

      {/* 팝오버 */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-72 rounded-2xl overflow-hidden z-50 animate-context-menu"
          style={{
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* 헤더 영역 */}
          <div
            className="px-4 py-4"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))",
              borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: "var(--notion-text)" }}
                >
                  {userInfo.displayName}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--notion-text-secondary)" }}
                >
                  {userInfo.email}
                </p>
              </div>
            </div>
          </div>

          {/* 통계 영역 */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)" }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: "rgba(59, 130, 246, 0.1)" }}
              >
                <svg
                  className="w-4 h-4"
                  style={{ color: "#3b82f6" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--notion-text-secondary)" }}
                >
                  작성한 스냅샷
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--notion-text)" }}
                >
                  {userInfo.snapshotCount}개
                </p>
              </div>
            </div>
          </div>

          {/* 액션 영역 */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-50"
              style={{ color: "#ef4444" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

