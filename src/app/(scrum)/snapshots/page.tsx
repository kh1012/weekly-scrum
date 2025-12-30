"use client";

import { useState } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { SnapshotViewer } from "@/components/weekly-scrum/snapshots";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { WeekTimeline } from "@/components/weekly-scrum/common/WeekTimeline";
import { ExpandableFilters } from "@/components/weekly-scrum/common/ExpandableFilters";

export default function SnapshotsPage() {
  const { currentData } = useScrumContext();
  const [isMobileTimelineOpen, setIsMobileTimelineOpen] = useState(false);

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LogoLoadingSpinner title="스냅샷을 불러오는 중" />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 h-[calc(100vh-4rem)] bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* 좌측: 주차 타임라인 (PC) */}
      <aside className="hidden lg:flex lg:w-80 lg:shrink-0 border-r border-[#d0d7de] overflow-y-auto">
        <WeekTimeline className="w-full" />
      </aside>

      {/* 모바일: 주차 타임라인 (오버레이) */}
      {isMobileTimelineOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileTimelineOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-[#d0d7de] px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#24292f]">
                주차 선택
              </h2>
              <button
                onClick={() => setIsMobileTimelineOpen(false)}
                className="p-2 hover:bg-[#f6f8fa] rounded-md transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <WeekTimeline className="w-full" />
          </div>
        </div>
      )}

      {/* 우측: 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 필터 바 */}
        <div className="shrink-0 bg-white border-b border-[#d0d7de] px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {/* 모바일: 타임라인 열기 버튼 */}
            <button
              onClick={() => setIsMobileTimelineOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0969da] bg-[#ddf4ff] rounded-lg hover:bg-[#b6e3ff] transition-colors"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">
                {currentData.year}년 {currentData.week}
              </span>
              <span className="sm:hidden">주차</span>
            </button>

            {/* 검색 + 필터 (통합 모드) */}
            <div className="flex-1 min-w-0">
              <ExpandableFilters unified withSearch />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <SnapshotViewer />
        </div>
      </div>
    </div>
  );
}

