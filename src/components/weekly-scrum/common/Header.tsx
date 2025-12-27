"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SideNavigation } from "./Navigation";
import { WeekSelector } from "./WeekSelector";
import { SearchInput } from "./SearchInput";
import { ExpandableFilters } from "./ExpandableFilters";
import { UserProfile } from "./UserProfile";
import { Logo } from "./Logo";
import type { WorkspaceRole } from "@/lib/auth/getWorkspaceRole";

interface HeaderProps {
  onMenuOpen?: () => void;
  role?: WorkspaceRole;
}

/**
 * GitHub 스타일 GNB (Global Navigation Bar)
 * - 상단 고정, 전체 너비
 * - 좌측: 햄버거 메뉴, 로고
 * - 우측: 검색, 필터, 프로필
 */
export function Header({ onMenuOpen, role }: HeaderProps) {
  const pathname = usePathname();
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // 개인 대시보드 페이지인지 확인
  const isMyDashboard = pathname === "/my" || pathname === "/my/";
  // 스냅샷 관리 페이지인지 확인
  const isManagePage =
    pathname === "/manage" ||
    pathname === "/manage/" ||
    pathname.startsWith("/manage/snapshots");
  // 캘린더 페이지인지 확인
  const isCalendarPage = pathname === "/calendar" || pathname === "/calendar/";
  // Admin Dashboard 페이지인지 확인
  const isAdminDashboard = pathname === "/admin" || pathname === "/admin/";
  // Admin 하위 페이지인지 확인
  const isAdminSubPage = pathname.startsWith("/admin/") && !isAdminDashboard;
  // Plans 페이지인지 확인
  const isPlansPage =
    pathname === "/plans" ||
    pathname === "/plans/" ||
    pathname.startsWith("/admin/plans") ||
    pathname.startsWith("/plans/gantt");
  // Feedbacks 페이지인지 확인
  const isFeedbacksPage =
    pathname === "/feedbacks" ||
    pathname === "/feedbacks/" ||
    pathname.startsWith("/feedbacks/");
  // Meta Options 페이지인지 확인
  const isMetaOptionsPage =
    pathname === "/admin/meta-options" ||
    pathname === "/admin/meta-options/" ||
    pathname.startsWith("/admin/meta-options/");
  
  // 최소 GNB 모드
  const isMinimalGnb =
    isMyDashboard ||
    isManagePage ||
    isAdminDashboard ||
    isPlansPage ||
    isFeedbacksPage ||
    isMetaOptionsPage;
  
  // GNB 컴포넌트 완전 숨김
  const hideAllControls = isMinimalGnb;
  // 주차 선택기 숨김
  const hideWeekSelector = isMinimalGnb || isCalendarPage;
  // 필터 숨김
  const hideFilters = isMinimalGnb;

  // 외부 클릭 시 필터 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(e.target as Node)
      ) {
        setIsFilterPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFilterPopoverOpen) {
        setIsFilterPopoverOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFilterPopoverOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full h-16 px-4 lg:px-6 bg-[#24292f] border-b border-[#424a53]"
    >
      <div className="flex items-center justify-between h-full max-w-full mx-auto">
        {/* 좌측: 햄버거 + 로고 + 주차 선택 */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* 햄버거 메뉴 버튼 */}
          <button
            onClick={onMenuOpen}
            className="flex items-center justify-center w-9 h-9 rounded-md text-white hover:bg-[#30363d] transition-colors"
            aria-label="메뉴 열기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo className="w-7 h-7 text-white" />
            <span className="hidden sm:block text-white font-semibold text-base">
              Weekly Scrum
            </span>
          </Link>

          {/* 구분선 */}
          {!hideWeekSelector && (
            <div className="hidden lg:block w-px h-6 bg-[#424a53]" />
          )}

          {/* 주차 선택기 */}
          {!hideWeekSelector && (
            <div className="hidden lg:block">
              <WeekSelector />
            </div>
          )}
        </div>

        {/* 우측: 검색 + 필터 + 프로필 */}
        <div className="flex items-center gap-3">
          {/* 검색 */}
          {!hideAllControls && (
            <div className="hidden sm:block">
              <SearchInput />
            </div>
          )}

          {/* 필터 */}
          {!hideFilters && (
            <>
              {/* 데스크톱: 필터 직접 표시 */}
              <div className="hidden xl:block">
                <ExpandableFilters />
              </div>

              {/* 모바일/태블릿: 필터 버튼 + 팝오버 */}
              <div className="xl:hidden relative" ref={filterPopoverRef}>
                <button
                  onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                  className="flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium text-white hover:bg-[#30363d] transition-colors"
                  aria-label="필터"
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">필터</span>
                </button>

                {/* 필터 팝오버 */}
                {isFilterPopoverOpen && (
                  <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-[#d0d7de] rounded-md shadow-lg z-50 animate-context-menu">
                    <ExpandableFilters />
                  </div>
                )}
              </div>
            </>
          )}

          {/* 구분선 */}
          <div className="w-px h-6 bg-[#424a53]" />

          {/* 프로필 */}
          <UserProfile />
        </div>
      </div>

      {/* 모바일: 2행 - 주차 선택기 */}
      {!hideWeekSelector && (
        <div className="lg:hidden px-4 py-2 border-t border-[#424a53]">
          <WeekSelector isMobile />
        </div>
      )}

      {/* 모바일: 3행 - 필터 */}
      {!hideFilters && (
        <div className="lg:hidden px-4 py-2 border-t border-[#424a53]">
          <ExpandableFilters isMobile />
        </div>
      )}
    </header>
  );
}

// PC 사이드바는 제거됨 (drawer로 대체)
// Sidebar 컴포넌트는 더 이상 사용하지 않음
export function Sidebar() {
  return null;
}
