"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlignmentGanttView,
  AlignmentFilterBar,
  useAlignmentFilter,
  type FilterType,
} from "@/components/weekly-scrum/alignment";
import { useDraftStore } from "@/components/plans/gantt-draft/store";
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
  initialViewMode: "detailed" | "summarized";
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
  initialViewMode,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setViewModeStore = useDraftStore((s) => s.setViewMode);

  // 초기 로드 시 URL의 viewMode를 store에 설정
  useEffect(() => {
    setViewModeStore(initialViewMode);
  }, [initialViewMode, setViewModeStore]);

  // 필터링 및 통계 계산 (담당자 필터 반영)
  const { filteredItems, stats } = useAlignmentFilter({
    items,
    filter,
    selectedAssignees,
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

  // viewMode 변경 핸들러 (store + URL 동시 업데이트)
  const handleViewModeChange = useCallback(
    (mode: "detailed" | "summarized") => {
      setViewModeStore(mode);
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "summarized") {
        params.set("viewMode", "summarized");
      } else {
        params.delete("viewMode"); // detailed가 기본값이므로 제거
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [setViewModeStore, router, searchParams]
  );

  // enableAlignmentCheck 변경 핸들러 (querystring을 먼저 업데이트)
  const handleEnableAlignmentCheckChange = useCallback(
    (enabled: boolean) => {
      // 1. querystring 먼저 업데이트
      const params = new URLSearchParams(searchParams.toString());
      if (enabled) {
        params.set("enableAlignmentCheck", "true");
      } else {
        params.delete("enableAlignmentCheck");
      }
      router.replace(`?${params.toString()}`, { scroll: false });

      // 2. state 업데이트 (연산 수행)
      setEnableAlignmentCheck(enabled);
    },
    [router, searchParams]
  );

  // 데이터 새로고침 핸들러
  const handleRefreshData = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    // 새로고침이 완료되면 상태 리셋 (약간의 지연 후)
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [router]);

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
      return (
        item.assignees?.some((a) => selectedAssignees.has(a.userId)) || false
      );
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
          selectedAssignees={selectedAssignees}
          onAssigneesChange={handleAssigneesChange}
          onViewModeChange={handleViewModeChange}
          enableAlignmentCheck={enableAlignmentCheck}
          onEnableAlignmentCheckChange={handleEnableAlignmentCheckChange}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
}
