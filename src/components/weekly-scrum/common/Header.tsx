"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SideNavigation } from "./Navigation";
import { WeekSelector } from "./WeekSelector";
import { SearchInput } from "./SearchInput";
import { ExpandableFilters } from "./ExpandableFilters";

interface HeaderProps {
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function Header({ isSidebarOpen = true, onSidebarToggle }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // 개인 대시보드 페이지인지 확인
  const isMyDashboard = pathname === "/my" || pathname === "/my/";
  // 스냅샷 관리 페이지인지 확인
  const isManagePage = pathname === "/manage" || pathname === "/manage/";
  // 필터 숨김 페이지
  const hideFilters = isMyDashboard || isManagePage;

  // 외부 클릭 시 메뉴/필터 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
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
      if (e.key === "Escape") {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isFilterPopoverOpen) setIsFilterPopoverOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, isFilterPopoverOpen]);

  const Logo = () => (
    <h1
      className="font-bold text-sm tracking-tight"
      style={{
        color: "var(--notion-text)",
        letterSpacing: "-0.02em",
      }}
    >
      Weekly Scrum
    </h1>
  );

  return (
    <header
      className="sticky top-0 z-40 glass-effect"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* 데스크탑 레이아웃 (lg 이상) - 1행 */}
      <div className="hidden lg:flex items-center justify-between h-14 px-4">
        {/* 좌측: 사이드바 토글 + (로고) + 주차 */}
        <div className="flex items-center gap-4">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 interactive-btn"
              style={{
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-secondary)",
              }}
              title={isSidebarOpen ? "사이드바 접기" : "사이드바 열기"}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {!isSidebarOpen && (
            <>
              <Logo />
              {!isManagePage && (
                <div
                  className="w-px h-6 rounded-full"
                  style={{ background: "var(--notion-border)" }}
                />
              )}
            </>
          )}
          {!isManagePage && <WeekSelector />}
        </div>

        {/* 우측: 검색 + 필터 */}
        <div className="flex items-center gap-4">
          <SearchInput />
          {!hideFilters && (
            <>
              <div
                className="w-px h-6 rounded-full"
                style={{ background: "var(--notion-border)" }}
              />

              {/* 1440px 이상: 필터 직접 표시 */}
              <div className="hidden wide:block">
                <ExpandableFilters />
              </div>

              {/* lg~1440px: 필터 버튼 + 팝오버 */}
              <div className="wide:hidden relative" ref={filterPopoverRef}>
                <button
                  onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                  className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: isFilterPopoverOpen
                      ? "rgba(59, 130, 246, 0.12)"
                      : "var(--notion-bg-secondary)",
                    color: isFilterPopoverOpen
                      ? "#3b82f6"
                      : "var(--notion-text-muted)",
                    border: isFilterPopoverOpen
                      ? "1px solid rgba(59, 130, 246, 0.25)"
                      : "1px solid transparent",
                  }}
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
                  <span>필터</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      isFilterPopoverOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* 필터 팝오버 */}
                {isFilterPopoverOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 p-3 rounded-2xl z-50 animate-context-menu"
                    style={{
                      background: "rgba(255, 255, 255, 0.98)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow:
                        "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <ExpandableFilters />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일/태블릿 레이아웃 */}
      <div className="lg:hidden">
        {/* 1행: 메뉴 + 로고 + 검색 */}
        <div
          className="flex items-center justify-between h-14 px-4 relative"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)" }}
          ref={menuRef}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 interactive-btn"
              style={{
                background: isMenuOpen
                  ? "rgba(59, 130, 246, 0.1)"
                  : "var(--notion-bg-secondary)",
                color: isMenuOpen ? "#3b82f6" : "var(--notion-text-secondary)",
              }}
              aria-label="메뉴"
            >
              <svg
                className="w-5 h-5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: isMenuOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Logo />
          </div>

          {/* 모바일 검색 */}
          <SearchInput isMobile />

          {/* Popover 메뉴 */}
          {isMenuOpen && (
            <div
              className="absolute top-full left-3 mt-2 w-64 rounded-2xl overflow-hidden z-50 animate-context-menu"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow:
                  "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <SideNavigation onItemClick={() => setIsMenuOpen(false)} />
            </div>
          )}
        </div>

        {/* 2행: 주차 선택 (manage 페이지가 아닐 때만) */}
        {!isManagePage && (
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)" }}
          >
            <WeekSelector isMobile />
          </div>
        )}

        {/* 3행: 필터 (필터 숨김 페이지가 아닐 때만) */}
        {!hideFilters && (
          <div className="px-4 py-3 overflow-x-auto">
            <ExpandableFilters isMobile />
          </div>
        )}
      </div>
    </header>
  );
}

// PC 사이드바 컴포넌트
interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-64 z-30 animate-slide-in-left"
      style={{
        background:
          "linear-gradient(180deg, rgba(251, 251, 250, 1) 0%, rgba(248, 248, 247, 1) 100%)",
        borderRight: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.02)",
      }}
    >
      <SideNavigation />
    </aside>
  );
}
