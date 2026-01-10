"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlignmentGanttView,
  AlignmentFilterBar,
  useAlignmentFilter,
  type FilterType,
} from "@/components/weekly-scrum/alignment";
import { useDraftStore } from "@/components/plans/gantt-draft/store";
import type { AlignmentGanttItem } from "@/lib/data/plans";

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
  initialViewMode: "detailed" | "summarized";
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
  initialViewMode,
}: AlignmentGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [enableAlignmentCheck, setEnableAlignmentCheck] = useState(
    initialEnableAlignmentCheck
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setViewModeStore = useDraftStore((s) => s.setViewMode);

  // 초기 로드 시 URL의 viewMode를 store에 설정
  useEffect(() => {
    setViewModeStore(initialViewMode);
  }, [initialViewMode, setViewModeStore]);

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

  // 필터링 및 통계 계산 (개인 페이지는 담당자 필터 없음)
  const { filteredItems, stats } = useAlignmentFilter({
    items,
    filter,
    selectedAssignees: new Set(), // 개인 페이지는 담당자 필터 없음
  });

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
