"use client";

import { Navigation } from "./Navigation";
import { StatsBar } from "./StatsBar";
import { WeekSelector } from "./WeekSelector";
import { SearchInput } from "./SearchInput";
import { Filters } from "./Filters";

export function Header() {
  return (
    <header className="bg-white border-b border-[#d0d7de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: 타이틀 | 탭 | 통계 */}
        <div className="flex items-center justify-between py-3 border-b border-[#eaeef2]">
          {/* 좌측: 타이틀 */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#1f2328]">Weekly Scrum</h1>
          </div>

          {/* 중앙: 탭 메뉴 */}
          <Navigation />

          {/* 우측: 통계 */}
          <StatsBar />
        </div>

        {/* Row 2: 주차 선택 | 검색 | 필터 */}
        <div className="flex items-center justify-between py-2.5">
          {/* 좌측: 주차 선택 */}
          <WeekSelector />

          {/* 중앙: 검색 */}
          <SearchInput />

          {/* 우측: 필터 */}
          <Filters />
        </div>
      </div>
    </header>
  );
}

