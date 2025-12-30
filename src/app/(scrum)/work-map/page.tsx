"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { WorkMapView } from "@/components/weekly-scrum/work-map";
import { WeekSelector } from "@/components/weekly-scrum/common/WeekSelector";
import { ExpandableFilters } from "@/components/weekly-scrum/common/ExpandableFilters";

export default function WorkMapPage() {
  const { filteredItems } = useScrumContext();

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-white flex flex-col">
      {/* 필터 바 */}
      <div className="shrink-0 bg-white py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          {/* 주차 선택기 */}
          <div className="w-full lg:w-auto">
            <WeekSelector isMobile={false} />
          </div>

          {/* 구분선 (PC만) */}
          <div className="hidden lg:block w-px h-6 bg-[#d0d7de]" />

          {/* 검색 + 필터 (통합 모드) */}
          <div className="w-full lg:flex-1">
            <ExpandableFilters unified withSearch />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        <WorkMapView items={filteredItems} />
      </div>
    </div>
  );
}
