"use client";

import { useState, useMemo } from "react";
import { AlignmentGanttView } from "@/components/weekly-scrum/alignment";
import { useAlignmentFilter, type FilterType } from "@/components/weekly-scrum/alignment/hooks";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";

interface AlignmentGanttClientProps {
  workspaceId: string;
  items: AlignmentGanttItem[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;
  userName?: string;
}

/**
 * Alignment Gantt Client Component
 *
 * AlignmentGanttView를 활용한 읽기 전용 간트 차트
 * Plans + Snapshot Entries를 타임라인에서 시각화
 * 필터: 전체보기, 계획만 보기, 스냅샷만 보기
 */
export function AlignmentGanttClient({
  workspaceId,
  items,
  members,
  userName,
}: AlignmentGanttClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  // 필터링 및 통계 계산
  const { filteredItems, stats } = useAlignmentFilter({ items, filter });

  return (
    <div className="flex flex-col h-full">
      {/* 필터 바 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
              filter === "all"
                ? "bg-[#0969da] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            전체{" "}
            <span className="text-[10px] opacity-80">
              ({stats.totalCount})
            </span>
          </button>
          <button
            onClick={() => setFilter("plans")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
              filter === "plans"
                ? "bg-[#0969da] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            계획{" "}
            <span className="text-[10px] opacity-80">({stats.plansCount})</span>
          </button>
          <button
            onClick={() => setFilter("snapshots")}
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

        {/* 우측 정보 */}
        <div className="text-xs text-gray-500">
          {filter === "all" &&
            `계획 ${stats.plansCount} · 스냅샷 ${stats.snapshotsCount}`}
          {filter === "plans" && `계획 ${stats.plansCount}개`}
          {filter === "snapshots" && `스냅샷 ${stats.snapshotsCount}개`}
        </div>
      </div>

      {/* Alignment Gantt Chart */}
      <div className="flex-1 overflow-hidden">
        <AlignmentGanttView
          workspaceId={workspaceId}
          items={filteredItems}
          members={members}
          title={userName ? `${userName}님의 Alignment` : "Alignment"}
          description="계획과 기록을 Align 해봅니다."
          showMismatchReview={true}
        />
      </div>
    </div>
  );
}
