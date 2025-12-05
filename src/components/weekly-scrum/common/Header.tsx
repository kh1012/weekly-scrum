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

  const MenuButton = ({ className = "" }: { className?: string }) => (
    <button
      onClick={() => setIsSideNavOpen(!isSideNavOpen)}
      className={`p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all ${className}`}
      aria-label={isSideNavOpen ? "메뉴 닫기" : "메뉴 열기"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSideNavOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );

  const Logo = ({ size = "normal" }: { size?: "small" | "normal" }) => (
    <div className="flex items-center gap-2">
      <div className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm ${
        size === "small" ? "w-6 h-6" : "w-7 h-7"
      }`}>
        <svg className={size === "small" ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h1 className={`font-semibold text-slate-800 ${size === "small" ? "text-sm" : "text-base"}`}>
        Weekly Scrum
      </h1>
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        {/* 데스크탑: 한 줄 레이아웃 - 전체 가로 폭 사용 */}
        <div className="hidden lg:flex items-center justify-between gap-4 px-4 py-2.5 w-full">
          {/* 좌측 그룹: 메뉴 + 타이틀 + 주차선택 */}
          <div className="flex items-center gap-4 shrink-0">
            {/* 메뉴 버튼 + 타이틀 */}
            <div className="flex items-center gap-2">
              <MenuButton />
              <Logo />
            </div>

            {/* 구분선 */}
            <div className="w-px h-6 bg-slate-200" />

            {/* 주차 선택 */}
            <WeekSelector />
          </div>

          {/* 중앙: 검색 (flex-1로 남은 공간 차지) */}
          <div className="flex-1 max-w-md mx-4">
            <SearchInput />
          </div>

          {/* 우측 그룹: 필터 + 통계 */}
          <div className="flex items-center gap-4 shrink-0">
            {/* 필터 */}
            <Filters />

            {/* 구분선 */}
            <div className="w-px h-6 bg-slate-200" />

            {/* 통계 */}
            <StatsBar />
          </div>
        </div>

        {/* 모바일/태블릿: 스택 레이아웃 */}
        <div className="lg:hidden divide-y divide-slate-100">
          {/* Row 1: 메뉴 + 타이틀 */}
          <div className="flex items-center gap-2 px-3 py-2">
            <MenuButton className="p-1.5 -ml-1" />
            <Logo size="small" />
          </div>

          {/* Row 2: 주차 선택 */}
          <div className="px-3 py-2.5">
            <WeekSelector isMobile />
          </div>

          {/* Row 3: 필터 */}
          <div className="px-3 py-2 overflow-x-auto">
            <Filters isMobile />
          </div>

          {/* Row 4: 검색 */}
          <div className="px-3 py-2">
            <SearchInput isMobile />
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isSideNavOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSideNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side Navigation Drawer */}
      <div
        ref={sideNavRef}
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isSideNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SideNavigation onItemClick={() => setIsSideNavOpen(false)} />
      </div>
    </>
  );
}
