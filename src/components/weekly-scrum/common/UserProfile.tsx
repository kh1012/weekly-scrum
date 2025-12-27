"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface UserInfo {
  email: string;
  displayName: string;
  snapshotCount: number;
}

// 기본 workspace ID
const DEFAULT_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

/**
 * 사용자 프로필 컴포넌트 - GitHub 스타일
 * - GNB 우측에 표시되는 프로필 아이콘
 * - 클릭 시 Portal 팝오버로 사용자 정보 표시
 */
export function UserProfile() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
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

      // 작성한 스냅샷 개수 가져오기
      const { count } = await supabase
        .from("snapshots")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", DEFAULT_WORKSPACE_ID)
        .eq("author_id", user.id);

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

  // 팝오버 위치 계산
  const updatePopoverPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  // 열릴 때 위치 계산
  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition();
      window.addEventListener("scroll", updatePopoverPosition);
      window.addEventListener("resize", updatePopoverPosition);
      return () => {
        window.removeEventListener("scroll", updatePopoverPosition);
        window.removeEventListener("resize", updatePopoverPosition);
      };
    }
  }, [isOpen, updatePopoverPosition]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && 
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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
      <div className="w-8 h-8 rounded-full bg-[#d0d7de] animate-pulse" />
    );
  }

  if (!userInfo) {
    return null;
  }

  // 이니셜 생성 (첫 글자)
  const initial = userInfo.displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* 프로필 버튼 - GitHub 스타일 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
          isOpen
            ? "bg-[#0969da] text-white"
            : "bg-[#0969da] text-white hover:bg-[#0860ca]"
        }`}
        title={userInfo.displayName}
      >
        {initial}
      </button>

      {/* 팝오버 - Portal로 body에 직접 렌더링 - GitHub 스타일 */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          className="fixed w-80 bg-white border border-[#d0d7de] rounded-md animate-context-menu"
          style={{
            top: popoverPosition.top,
            right: popoverPosition.right,
            zIndex: 99999,
            boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
          }}
        >
          {/* 헤더 영역 */}
          <div className="px-4 py-3 border-b border-[#d0d7de]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-base shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#24292f] truncate">
                  {userInfo.displayName}
                </p>
                <p className="text-xs text-[#57606a] truncate mt-0.5">
                  {userInfo.email}
                </p>
              </div>
            </div>
          </div>

          {/* 통계 영역 */}
          <div className="px-4 py-3 border-b border-[#d0d7de]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#ddf4ff]">
                <svg
                  className="w-4 h-4 text-[#0969da]"
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
                <p className="text-xs text-[#57606a]">
                  작성한 스냅샷
                </p>
                <p className="text-sm font-semibold text-[#24292f]">
                  {userInfo.snapshotCount}개
                </p>
              </div>
            </div>
          </div>

          {/* 액션 영역 */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#cf222e] hover:bg-[#ffebe9] transition-colors"
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
        </div>,
        document.body
      )}
    </>
  );
}
