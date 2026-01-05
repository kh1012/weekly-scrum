"use client";

import { useState } from "react";
import {
  AlignmentGanttView,
  AlignmentFilterBar,
  useAlignmentFilter,
  type FilterType,
} from "@/components/weekly-scrum/alignment";
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
      <AlignmentFilterBar
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
        showUniqueAuthors={false}
      />

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
