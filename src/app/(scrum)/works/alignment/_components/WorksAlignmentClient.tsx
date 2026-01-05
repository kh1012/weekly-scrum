"use client";

import { useState, useMemo } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft/DraftGanttView";
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

type FilterType = "all" | "plans" | "snapshots";

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

  // 필터링 및 정렬된 items
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (filter === "plans") {
      filtered = items.filter((item) => item.type === "plan");
    } else if (filter === "snapshots") {
      filtered = items.filter((item) => item.type === "snapshot");
    }
    
    return filtered.sort((a, b) => {
      const domainCompare = (a.domain || "").localeCompare(b.domain || "");
      if (domainCompare !== 0) return domainCompare;
      
      const projectCompare = (a.project || "").localeCompare(b.project || "");
      if (projectCompare !== 0) return projectCompare;
      
      const moduleCompare = (a.module || "").localeCompare(b.module || "");
      if (moduleCompare !== 0) return moduleCompare;
      
      const featureCompare = (a.feature || "").localeCompare(b.feature || "");
      if (featureCompare !== 0) return featureCompare;
      
      if (a.type !== b.type) {
        return a.type === "plan" ? -1 : 1;
      }
      
      return a.start_date.localeCompare(b.start_date);
    });
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
    isSnapshot: item.type === "snapshot",
    avgProgress: item.avgProgress,
    metaKey: item.metaKey,
    year: item.year,
    week: item.week,
    authorName: item.authorName,
    authorId: item.authorId,
    past_week: item.past_week,
    this_week: item.this_week,
    collaborators: item.collaborators,
    risks: item.risks,
    risk_level: item.risk_level,
  }));

  // 통계 계산
  const stats = useMemo(() => {
    const plansCount = items.filter((item) => item.type === "plan").length;
    const snapshotsCount = items.filter((item) => item.type === "snapshot").length;
    const uniqueAuthors = new Set(
      items
        .filter((item) => item.type === "snapshot" && item.authorName)
        .map((item) => item.authorName)
    ).size;
    return { plansCount, snapshotsCount, uniqueAuthors };
  }, [items]);

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
              ({stats.plansCount + stats.snapshotsCount})
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
            `계획 ${stats.plansCount} · 스냅샷 ${stats.snapshotsCount} · 참여자 ${stats.uniqueAuthors}`}
          {filter === "plans" && `계획 ${stats.plansCount}개`}
          {filter === "snapshots" &&
            `스냅샷 ${stats.snapshotsCount}개 (참여자 ${stats.uniqueAuthors}명)`}
        </div>
      </div>

      {/* 간트 차트 */}
      <div className="flex-1 overflow-hidden">
        <DraftGanttView
          workspaceId={workspaceId}
          initialPlans={initialPlans}
          members={members}
          readOnly={true}
          title="Workspace Alignment"
          description="전체 계획과 실행 기록을 확인합니다."
          selectedStages={new Set()}
          selectedAssignees={new Set()}
        />
      </div>
    </div>
  );
}

