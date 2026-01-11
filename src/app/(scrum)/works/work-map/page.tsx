"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { WorkMapView } from "@/components/weekly-scrum/work-map";
import { WeekSelector } from "@/components/weekly-scrum/common/WeekSelector";
import { ExpandableFilters } from "@/components/weekly-scrum/common/ExpandableFilters";

export default function WorkMapPage() {
  const { filteredItems } = useScrumContext();

  return (
    <div className="overflow-hidden bg-white flex flex-col">
      {/* 필터 바 */}
      <div className="shrink-0 bg-white py-3">
        {/* 데스크톱: 1행 레이아웃 */}
        <div className="hidden lg:flex items-center gap-3">
          {/* 주차 선택기 */}
          <div className="w-auto">
            <WeekSelector isMobile={false} />
          </div>

          {/* 구분선 */}
          <div className="w-px h-6 bg-[#d0d7de]" />

          {/* 검색 + 필터 (통합 모드) */}
          <div className="flex-1">
            <ExpandableFilters unified withSearch />
          </div>
        </div>

        {/* 모바일: 여러 행 레이아웃 */}
        <div className="flex lg:hidden flex-col gap-3">
          {/* WeekSelector 모바일 레이아웃 (내부적으로 2-3행) */}
          <div className="w-full">
            <WeekSelector isMobile={true} />
          </div>

          {/* 검색 + 필터 */}
          <div className="w-full">
            <ExpandableFilters unified withSearch />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1">
        <WorkMapView items={filteredItems} />
      </div>
    </div>
  );
}
