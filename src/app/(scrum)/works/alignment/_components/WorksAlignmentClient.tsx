"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  initialFilter: FilterType;
  initialAssignees: string[];
  initialEnableAlignmentCheck: boolean;
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
  initialFilter,
  initialAssignees,
  initialEnableAlignmentCheck,
}: WorksAlignmentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(
    new Set(initialAssignees)
  );
  const [enableAlignmentCheck, setEnableAlignmentCheck] = useState(
    initialEnableAlignmentCheck
  );

  // 필터링 및 통계 계산 (담당자 필터 반영)
  const { filteredItems, stats } = useAlignmentFilter({ 
    items, 
    filter,
    selectedAssignees 
  });

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

  // 담당자 필터 변경 핸들러 (querystring 업데이트)
  const handleAssigneesChange = useCallback(
    (assignees: Set<string>) => {
      setSelectedAssignees(assignees);
      const params = new URLSearchParams(searchParams.toString());
      if (assignees.size > 0) {
        params.set("assignees", Array.from(assignees).join(","));
      } else {
        params.delete("assignees");
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

  // 담당자 필터 적용 (클라이언트에서 한 번만)
  const assigneeFilteredItems = useMemo(() => {
    if (selectedAssignees.size === 0) {
      return filteredItems;
    }

    return filteredItems.filter((item) => {
      // Snapshot인 경우
      if (item.type === "snapshot") {
        return item.authorId && selectedAssignees.has(item.authorId);
      }
      // Plan인 경우
      return item.assignees?.some((a) => selectedAssignees.has(a.userId)) || false;
    });
  }, [filteredItems, selectedAssignees]);

  return (
    <div className="flex flex-col h-full">
      {/* 필터 바 */}
      <AlignmentFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        stats={stats}
        showUniqueAuthors={true}
      />

      {/* Alignment Gantt Chart */}
      <div className="flex-1 overflow-hidden">
        <AlignmentGanttView
          workspaceId={workspaceId}
          items={assigneeFilteredItems}
          members={members}
          title="Workspace Alignment"
          description="전체 계획과 실행 기록을 확인합니다."
          showMismatchReview={enableAlignmentCheck}
          selectedAssignees={selectedAssignees}
          onAssigneesChange={handleAssigneesChange}
          enableAlignmentCheck={enableAlignmentCheck}
          onEnableAlignmentCheckChange={handleEnableAlignmentCheckChange}
        />
      </div>
    </div>
  );
}

