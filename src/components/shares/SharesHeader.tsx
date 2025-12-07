"use client";

import { useState, useEffect, useRef } from "react";
import { SharesWeekSelector } from "./SharesWeekSelector";
import { SideNavigation } from "@/components/weekly-scrum/common/Navigation";

interface SharesHeaderProps {
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function SharesHeader({ isSidebarOpen = true, onSidebarToggle }: SharesHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const Logo = () => (
    <div className="flex items-center gap-1.5">
      <span className="text-base">📣</span>
      <span className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
        Shares
      </span>
    </div>
  );

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--notion-bg)",
        borderBottom: "1px solid var(--notion-border)",
      }}
    >
      {/* 데스크탑 레이아웃 */}
      <div className="hidden md:flex items-center justify-between h-11 px-3">
        {/* 좌측: 사이드바 토글 + (로고) */}
        <div className="flex items-center gap-2">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="notion-btn p-1.5"
              title={isSidebarOpen ? "사이드바 접기" : "사이드바 열기"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--notion-text-secondary)' }}>
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          )}
          {!isSidebarOpen && <Logo />}
        </div>

        {/* 우측: 주차 선택기 */}
        <SharesWeekSelector />
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden">
        {/* 1행: 메뉴 + 로고 */}
        <div
          className="flex items-center gap-2 h-11 px-3 relative"
          style={{ borderBottom: "1px solid var(--notion-border)" }}
          ref={menuRef}
        >
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="notion-btn p-1.5"
            aria-label="메뉴"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--notion-text-secondary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo />

          {/* Popover 메뉴 */}
          {isMenuOpen && (
            <div
              className="absolute top-full left-2 mt-1 w-56 rounded-lg overflow-hidden z-50 animate-fadeIn"
              style={{
                background: "var(--notion-bg)",
                boxShadow: "var(--notion-shadow-md)",
                border: "1px solid var(--notion-border)",
              }}
            >
              <SideNavigation onItemClick={() => setIsMenuOpen(false)} />
            </div>
          )}
        </div>

        {/* 2행: 주차 선택기 */}
        <div className="px-3 py-2 overflow-x-auto">
          <SharesWeekSelector isMobile />
        </div>
      </div>
    </header>
  );
}

// PC 사이드바 컴포넌트
interface SidebarProps {
  isOpen: boolean;
}

export function SharesSidebar({ isOpen }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside 
      className="hidden md:flex flex-col fixed top-0 left-0 h-full w-60 z-30"
      style={{ 
        background: 'var(--notion-sidebar-bg)',
        borderRight: '1px solid var(--notion-border)'
      }}
    >
      <SideNavigation />
    </aside>
  );
}
