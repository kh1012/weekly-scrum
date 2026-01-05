"use client";

import { useState, useMemo } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft/DraftGanttView";
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

type FilterType = "all" | "plans" | "snapshots";

/**
 * Alignment Gantt Client Component
 *
 * DraftGanttView를 활용한 읽기 전용 간트 차트
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

  // 필터링된 items
  const filteredItems = useMemo(() => {
    if (filter === "plans") {
      return items.filter((item) => item.type === "plan");
    }
    if (filter === "snapshots") {
      return items.filter((item) => item.type === "snapshot");
    }
    return items; // "all"
  }, [items, filter]);

  // AlignmentGanttItem을 InitialPlan 형식으로 변환
  const initialPlans = filteredItems.map((item) => ({
    id: item.id,
    clientUid: item.id,
    title: item.title,
    domain: item.domain || "",
    project: item.project || "",
    module: item.module || "",
    feature: item.feature || "",
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status || "active",
    stage: item.stage || "in_progress",
    priority: item.priority,
    assignees: item.assignees || [],
    // Snapshot 전용 데이터 전달
    isSnapshot: item.type === "snapshot",
    avgProgress: item.avgProgress,
    metaKey: item.metaKey,
    year: item.year,
    week: item.week,
  }));

  // 통계 계산
  const stats = useMemo(() => {
    const plansCount = items.filter((item) => item.type === "plan").length;
    const snapshotsCount = items.filter(
      (item) => item.type === "snapshot"
    ).length;
    return { plansCount, snapshotsCount };
  }, [items]);

  return (
    <div className="flex flex-col h-full">
      {/* 필터 바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {/* 필터 버튼 그룹 */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === "all"
                  ? "bg-[#0969da] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              전체보기
              <span className="ml-1.5 text-xs opacity-75">
                ({stats.plansCount + stats.snapshotsCount})
              </span>
            </button>
            <button
              onClick={() => setFilter("plans")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === "plans"
                  ? "bg-[#0969da] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              계획만 보기
              <span className="ml-1.5 text-xs opacity-75">
                ({stats.plansCount})
              </span>
            </button>
            <button
              onClick={() => setFilter("snapshots")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === "snapshots"
                  ? "bg-[#0969da] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              스냅샷만 보기
              <span className="ml-1.5 text-xs opacity-75">
                ({stats.snapshotsCount})
              </span>
            </button>
          </div>
        </div>

        {/* 우측 정보 */}
        <div className="text-xs text-gray-500">
          {filter === "all" && (
            <span>
              계획 {stats.plansCount}개 · 스냅샷 {stats.snapshotsCount}개
            </span>
          )}
          {filter === "plans" && <span>계획 {stats.plansCount}개</span>}
          {filter === "snapshots" && (
            <span>스냅샷 {stats.snapshotsCount}개</span>
          )}
        </div>
      </div>

      {/* 간트 차트 */}
      <div className="flex-1 overflow-hidden">
        <DraftGanttView
          workspaceId={workspaceId}
          initialPlans={initialPlans}
          members={members}
          readOnly={true}
          title={userName ? `${userName}님의 Alignment` : "Alignment"}
          selectedStages={new Set()}
          selectedAssignees={new Set()}
        />
      </div>
    </div>
  );
}
