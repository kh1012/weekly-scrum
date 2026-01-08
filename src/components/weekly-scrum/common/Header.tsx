"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SideNavigation, getBreadcrumbFromPath } from "./Navigation";
import { WeekSelector } from "./WeekSelector";
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
  // Admin Dashboard 페이지인지 확인
  const isAdminDashboard = pathname === "/admin" || pathname === "/admin/";
  // Admin 하위 페이지인지 확인
  const isAdminSubPage = pathname.startsWith("/admin/") && !isAdminDashboard;
  // Plans 페이지인지 확인
  const isPlansPage =
    pathname === "/works/plans" ||
    pathname === "/works/plans/" ||
    pathname.startsWith("/admin/plans") ||
    pathname.startsWith("/works/plans/gantt");
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
  // Team Feed 페이지인지 확인
  const isTeamFeedPage =
    pathname === "/works/team-feed" ||
    pathname === "/works/team-feed/" ||
    pathname.startsWith("/works/team-feed/");
  // Releases 페이지인지 확인
  const isReleasesPage =
    pathname === "/releases" ||
    pathname === "/releases/" ||
    pathname.startsWith("/releases/");
  const isAdminPage =
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/admin/");
  const isCollaboratorGraphPage =
    pathname === "/works/collaborator-graph" ||
    pathname === "/works/collaborator-graph/" ||
    pathname.startsWith("/works/collaborator-graph/");
  const isAlignmentPage =
    pathname === "/my/alignment" ||
    pathname === "/my/alignment/" ||
    pathname.startsWith("/my/alignment/") ||
    pathname === "/works/alignment" ||
    pathname === "/works/alignment/" ||
    pathname.startsWith("/works/alignment/");
  const isSettingsPage =
    pathname === "/profile/settings" ||
    pathname === "/profile/settings/" ||
    pathname.startsWith("/profile/settings/");
  const isFigmaFilesPage =
    pathname === "/works/figma-files" ||
    pathname === "/works/figma-files/" ||
    pathname.startsWith("/works/figma-files/");

  // Snapshots/Work-map 페이지 여부 (페이지 내부에 통합 필터 있음)
  const hasInternalFilters =
    pathname === "/works/snapshots" ||
    pathname === "/works/snapshots/" ||
    pathname.startsWith("/works/snapshots/") ||
    pathname === "/works/work-map" ||
    pathname === "/works/work-map/" ||
    pathname.startsWith("/works/work-map/");

  // 최소 GNB 모드
  const isMinimalGnb =
    isMyDashboard ||
    isManagePage ||
    isAdminDashboard ||
    isPlansPage ||
    isFeedbacksPage ||
    isMetaOptionsPage ||
    isTeamFeedPage ||
    isReleasesPage ||
    isAdminPage ||
    isCollaboratorGraphPage ||
    isAlignmentPage ||
    isSettingsPage ||
    isFigmaFilesPage;

  // GNB 컴포넌트 완전 숨김
  const hideAllControls = isMinimalGnb;
  // 주차 선택기 숨김
  const hideWeekSelector = isMinimalGnb || hasInternalFilters;
  // 필터 숨김 (최소 GNB 모드 + 페이지 내부에 필터가 있는 경우)
  const hideFilters = isMinimalGnb || hasInternalFilters;

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
    <header className="sticky top-0 z-[40] w-full h-16 px-4 lg:px-6 bg-[#f6f8fa] border-b border-[#d0d7de]">
      <div className="flex items-center justify-between h-full max-w-full mx-auto">
        {/* 좌측: 햄버거 + 로고 + 주차 선택 */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* 햄버거 메뉴 버튼 */}
          <button
            onClick={onMenuOpen}
            className="flex items-center justify-center w-9 h-9 rounded-md text-[#24292f] hover:bg-[#d0d7de] transition-colors"
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

          {/* 로고 & Breadcrumb */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Logo className="w-7 h-7" />
            <div className="hidden sm:flex flex-col gap-1">
              <span className="text-[#24292f] font-semibold text-sm leading-tight">
                Weekly Scrum
              </span>
              {(() => {
                const breadcrumb = getBreadcrumbFromPath(pathname);
                if (breadcrumb.category && breadcrumb.menu) {
                  return (
                    <span className="text-[#57606a] text-xs leading-tight">
                      {breadcrumb.category} / {breadcrumb.menu}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </Link>

          {/* 구분선 */}
          {!hideWeekSelector && (
            <div className="hidden lg:block w-px h-6 bg-[#d0d7de]" />
          )}

          {/* 주차 선택기 */}
          {!hideWeekSelector && (
            <div className="hidden lg:block">
              <WeekSelector />
            </div>
          )}
        </div>

        {/* 우측: 필터 + 프로필 */}
        <div className="flex items-center gap-3">
          {/* 필터 - 항상 표시 */}
          {!hideFilters && (
            <div className="flex items-center">
              <ExpandableFilters
              // 기본 필터 값 설정 (옵션)
              // defaultFilters={{
              //   members: ["김철수"],
              //   projects: ["weekly-scrum"]
              // }}
              />
            </div>
          )}

          {/* 구분선 */}
          <div className="w-px h-6 bg-[#d0d7de]" />

          {/* 프로필 */}
          <UserProfile />
        </div>
      </div>

      {/* 모바일: 2행 - 주차 선택기 */}
      {!hideWeekSelector && (
        <div className="lg:hidden px-4 py-2 border-t border-[#d0d7de]">
          <WeekSelector isMobile />
        </div>
      )}

      {/* 모바일: 3행 - 필터 */}
      {!hideFilters && (
        <div className="lg:hidden px-4 py-2 border-t border-[#d0d7de]">
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
