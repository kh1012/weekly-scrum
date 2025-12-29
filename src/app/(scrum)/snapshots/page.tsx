"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { SnapshotViewer } from "@/components/weekly-scrum/snapshots";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { WeekSelector } from "@/components/weekly-scrum/common/WeekSelector";
import { ExpandableFilters } from "@/components/weekly-scrum/common/ExpandableFilters";

export default function SnapshotsPage() {
  const { currentData } = useScrumContext();

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LogoLoadingSpinner title="스냅샷을 불러오는 중" />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 h-[calc(100vh-4rem)] overflow-y-auto bg-white flex flex-col">
      {/* 필터 바 */}
      <div className="shrink-0 bg-white border-b border-[#d0d7de] px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          {/* 주차 선택기 */}
          <div className="w-full lg:w-auto">
            <WeekSelector isMobile={false} />
          </div>

          {/* 구분선 (PC만) */}
          <div className="hidden lg:block w-px h-6 bg-[#d0d7de]" />

          {/* 필터 */}
          <div className="w-full lg:w-auto flex-1">
            <ExpandableFilters isMobile={false} />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <SnapshotViewer />
      </div>
    </div>
  );
}

