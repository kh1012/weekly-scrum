"use client";

import { useState, useEffect, useRef } from "react";
import { SideNavigation } from "./Navigation";
import { StatsBar } from "./StatsBar";
import { WeekSelector } from "./WeekSelector";
import { SearchInput } from "./SearchInput";
import { Filters } from "./Filters";

export function Header() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const sideNavRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSideNavOpen) {
        setIsSideNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSideNavOpen]);

  // 바디 스크롤 방지
  useEffect(() => {
    if (isSideNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSideNavOpen]);

  const MenuButton = () => (
    <button
      onClick={() => setIsSideNavOpen(!isSideNavOpen)}
      className="notion-btn p-1.5"
      aria-label={isSideNavOpen ? "메뉴 닫기" : "메뉴 열기"}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--notion-text-secondary)' }}>
        {isSideNavOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );

  const Logo = () => (
    <h1 className="font-semibold text-sm" style={{ color: 'var(--notion-text)' }}>
      Weekly Scrum
    </h1>
  );

  return (
    <>
      {/* Notion 스타일 헤더 */}
      <header 
        className="sticky top-0 z-40"
        style={{ 
          background: 'var(--notion-bg)',
          borderBottom: '1px solid var(--notion-border)'
        }}
      >
        {/* 데스크탑 레이아웃 */}
        <div className="hidden lg:flex items-center justify-between h-11 px-3">
          {/* 좌측: 메뉴 + 로고 + 주차 */}
          <div className="flex items-center gap-2">
            <MenuButton />
            <Logo />
            <div className="w-px h-5 mx-2" style={{ background: 'var(--notion-border)' }} />
            <WeekSelector />
          </div>

          {/* 중앙: 검색 */}
          <div className="flex-1 max-w-sm mx-6">
            <SearchInput />
          </div>

          {/* 우측: 필터 + 통계 */}
          <div className="flex items-center gap-3">
            <Filters />
            <div className="w-px h-5" style={{ background: 'var(--notion-border)' }} />
            <StatsBar />
          </div>
        </div>

        {/* 모바일/태블릿 레이아웃 */}
        <div className="lg:hidden">
          {/* 1행: 메뉴 + 로고 */}
          <div className="flex items-center gap-2 h-11 px-3" style={{ borderBottom: '1px solid var(--notion-border)' }}>
            <MenuButton />
            <Logo />
          </div>

          {/* 2행: 주차 선택 */}
          <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--notion-border)' }}>
            <WeekSelector isMobile />
          </div>

          {/* 3행: 필터 */}
          <div className="px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--notion-border)' }}>
            <Filters isMobile />
          </div>

          {/* 4행: 검색 */}
          <div className="px-3 py-2">
            <SearchInput isMobile />
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isSideNavOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity"
          style={{ background: 'rgba(15, 15, 15, 0.6)' }}
          onClick={() => setIsSideNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Notion 스타일 Side Navigation Drawer */}
      <div
        ref={sideNavRef}
        className={`fixed top-0 left-0 h-full w-60 z-50 transform transition-transform duration-200 ease-out ${
          isSideNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ 
          background: 'var(--notion-sidebar-bg)',
          boxShadow: isSideNavOpen ? 'var(--notion-shadow-md)' : 'none'
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsSideNavOpen(false)}
          className="absolute top-2 right-2 notion-btn p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--notion-text-secondary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SideNavigation onItemClick={() => setIsSideNavOpen(false)} />
      </div>
    </>
  );
}
