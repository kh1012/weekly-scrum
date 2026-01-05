"use client";

import { useState } from "react";
import {
  AlignmentGanttView,
  AlignmentFilterBar,
  useAlignmentFilter,
  type FilterType,
} from "@/components/weekly-scrum/alignment";
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
      <AlignmentFilterBar
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
        showUniqueAuthors={true}
      />

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

