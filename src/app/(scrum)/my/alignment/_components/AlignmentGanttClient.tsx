"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  initialFilter: FilterType;
  initialEnableAlignmentCheck: boolean;
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
  initialFilter,
  initialEnableAlignmentCheck,
}: AlignmentGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [enableAlignmentCheck, setEnableAlignmentCheck] = useState(
    initialEnableAlignmentCheck
  );

  // filter 변경 핸들러 (querystring 업데이트)
  const handleFilterChange = useCallback(
    (newFilter: FilterType) => {
      setFilter(newFilter);
      const params = new URLSearchParams(searchParams.toString());
      if (newFilter === "all") {
        params.delete("filter");
      } else {
        params.set("filter", newFilter);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // enableAlignmentCheck 변경 핸들러 (querystring 업데이트)
  const handleEnableAlignmentCheckChange = useCallback(
    (enabled: boolean) => {
      setEnableAlignmentCheck(enabled);
      const params = new URLSearchParams(searchParams.toString());
      if (enabled) {
        params.set("enableAlignmentCheck", "true");
      } else {
        params.delete("enableAlignmentCheck");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 필터링 및 통계 계산
  const { filteredItems, stats } = useAlignmentFilter({ items, filter });

  return (
    <div className="flex flex-col h-full">
      {/* 필터 바 */}
      <AlignmentFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        stats={stats}
        showUniqueAuthors={false}
      />

      {/* Alignment Gantt Chart - 개인 페이지는 담당자 필터 없음 */}
      <div className="flex-1 overflow-hidden">
        <AlignmentGanttView
          workspaceId={workspaceId}
          items={filteredItems}
          members={members}
          title={userName ? `${userName}님의 Alignment` : "Alignment"}
          description="계획과 기록을 Align 해봅니다."
          showMismatchReview={enableAlignmentCheck}
          enableAlignmentCheck={enableAlignmentCheck}
          onEnableAlignmentCheckChange={handleEnableAlignmentCheckChange}
        />
      </div>
    </div>
  );
}
