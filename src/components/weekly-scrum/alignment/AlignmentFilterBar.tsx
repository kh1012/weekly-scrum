/**
 * AlignmentFilterBar Component
 * 
 * Alignment 페이지의 필터 바 UI 컴포넌트
 * - 전체/계획/스냅샷 필터 버튼
 * - 통계 정보 표시
 */

"use client";

import type { FilterType } from "./hooks";

interface AlignmentFilterBarProps {
  /** 현재 선택된 필터 */
  filter: FilterType;
  
  /** 필터 변경 핸들러 */
  onFilterChange: (filter: FilterType) => void;
  
  /** 통계 정보 */
  stats: {
    plansCount: number;
    snapshotsCount: number;
    uniqueAuthors: number;
    totalCount: number;
  };
  
  /** 참여자 수 표시 여부 (workspace-wide view용) */
  showUniqueAuthors?: boolean;
}

/**
 * AlignmentFilterBar
 * 
 * Alignment 페이지 상단의 필터 바 컴포넌트
 * - 전체/계획/스냅샷 필터링
 * - 통계 정보 표시
 */
export function AlignmentFilterBar({
  filter,
  onFilterChange,
  stats,
  showUniqueAuthors = false,
}: AlignmentFilterBarProps) {
  return (
    <div className="hidden md:flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
      {/* 필터 버튼 그룹 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onFilterChange("all")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
            filter === "all"
              ? "bg-[#0969da] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          전체{" "}
          <span className="text-[10px] opacity-80">({stats.totalCount})</span>
        </button>
        <button
          disabled
          className="px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 opacity-50 cursor-not-allowed text-gray-400"
          title="계획 탭은 현재 비활성화되어 있습니다"
        >
          계획{" "}
          <span className="text-[10px] opacity-80">({stats.plansCount})</span>
        </button>
        <button
          onClick={() => onFilterChange("snapshots")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
            filter === "snapshots"
              ? "bg-[#0969da] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          스냅샷{" "}
          <span className="text-[10px] opacity-80">
            ({stats.snapshotsCount})
          </span>
        </button>
      </div>

      {/* 우측 통계 정보 */}
      <div className="text-xs text-gray-500">
        {filter === "all" && (
          <>
            {showUniqueAuthors ? (
              <>
                계획 {stats.plansCount} · 스냅샷 {stats.snapshotsCount} · 참여자{" "}
                {stats.uniqueAuthors}명
              </>
            ) : (
              <>
                계획 {stats.plansCount} · 스냅샷 {stats.snapshotsCount}
              </>
            )}
          </>
        )}
        {filter === "plans" && `계획 ${stats.plansCount}개`}
        {filter === "snapshots" && (
          <>
            {showUniqueAuthors ? (
              <>스냅샷 {stats.snapshotsCount}개 (참여자 {stats.uniqueAuthors}명)</>
            ) : (
              <>스냅샷 {stats.snapshotsCount}개</>
            )}
          </>
        )}
      </div>
    </div>
  );
}

