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

  return (
    <>
      <header className="glass-effect sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: 메뉴 버튼 | 타이틀 | 통계 */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            {/* 좌측: 메뉴 버튼 + 타이틀 */}
            <div className="flex items-center gap-3">
              {/* 햄버거/닫기 버튼 */}
              <button
                onClick={() => setIsSideNavOpen(!isSideNavOpen)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
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

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold text-slate-800">Weekly Scrum</h1>
              </div>
            </div>

            {/* 우측: 통계 (데스크탑) */}
            <div className="hidden lg:block">
              <StatsBar />
            </div>
          </div>

          {/* Row 2: 주차 선택 | 검색 | 필터 */}
          <div className="py-3 space-y-3 lg:space-y-0">
            {/* 데스크탑 레이아웃 */}
            <div className="hidden lg:flex items-center justify-between">
              <WeekSelector />
              <SearchInput />
              <Filters />
            </div>

            {/* 모바일/태블릿 레이아웃 */}
            <div className="lg:hidden space-y-3">
              <WeekSelector />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchInput />
                </div>
                <Filters />
              </div>
            </div>
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
