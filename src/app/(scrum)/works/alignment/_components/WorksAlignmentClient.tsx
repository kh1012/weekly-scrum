"use client";

import { useState } from "react";
import { AlignmentGanttView } from "@/components/weekly-scrum/alignment";
import { useAlignmentFilter, type FilterType } from "@/components/weekly-scrum/alignment/hooks";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";

interface WorksAlignmentClientProps {
  workspaceId: string;
  items: AlignmentGanttItem[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;
}

/**
 * Works Alignment Client Component
 * 
 * Workspace-wide alignment view
 * - 모든 Plans + 모든 사용자의 Snapshot Entries
 * - 개인별 연결 화살표 표시
 * - 읽기 전용
 */
export function WorksAlignmentClient({
  workspaceId,
  items,
  members,
}: WorksAlignmentClientProps) {
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
            `계획 ${stats.plansCount} · 스냅샷 ${stats.snapshotsCount} · 참여자 ${stats.uniqueAuthors}명`}
          {filter === "plans" && `계획 ${stats.plansCount}개`}
          {filter === "snapshots" &&
            `스냅샷 ${stats.snapshotsCount}개 (참여자 ${stats.uniqueAuthors}명)`}
        </div>
      </div>

      {/* Alignment Gantt Chart */}
      <div className="flex-1 overflow-hidden">
        <AlignmentGanttView
          workspaceId={workspaceId}
          items={filteredItems}
          members={members}
          title="Workspace Alignment"
          description="전체 계획과 실행 기록을 확인합니다."
          showMismatchReview={true}
        />
      </div>
    </div>
  );
}

