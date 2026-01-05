"use client";

import { useState, useMemo } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft/DraftGanttView";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";
import { calculateAlignmentStatus } from "@/lib/alignment/alignmentStatus";
import type { DraftBar } from "@/components/plans/gantt-draft/types";

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

  // 필터링 및 정렬된 items
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // 필터링
    if (filter === "plans") {
      filtered = items.filter((item) => item.type === "plan");
    } else if (filter === "snapshots") {
      filtered = items.filter((item) => item.type === "snapshot");
    }
    
    // 정렬: 같은 모듈 내에서 Plan은 상위, Snapshot은 하위
    // 1차: domain > project > module > feature
    // 2차: type (plan -> snapshot)
    // 3차: 날짜 (start_date)
    return filtered.sort((a, b) => {
      // 1. Domain 비교
      const domainCompare = (a.domain || "").localeCompare(b.domain || "");
      if (domainCompare !== 0) return domainCompare;
      
      // 2. Project 비교
      const projectCompare = (a.project || "").localeCompare(b.project || "");
      if (projectCompare !== 0) return projectCompare;
      
      // 3. Module 비교
      const moduleCompare = (a.module || "").localeCompare(b.module || "");
      if (moduleCompare !== 0) return moduleCompare;
      
      // 4. Feature 비교
      const featureCompare = (a.feature || "").localeCompare(b.feature || "");
      if (featureCompare !== 0) return featureCompare;
      
      // 5. Type 비교 (plan이 먼저)
      if (a.type !== b.type) {
        return a.type === "plan" ? -1 : 1;
      }
      
      // 6. 날짜 비교
      return a.start_date.localeCompare(b.start_date);
    });
  }, [items, filter]);

  // AlignmentGanttItem을 InitialPlan 형식으로 변환
  // (상태 계산은 변환 후에 수행)
  const initialPlans = useMemo(() => {
    const plans = filteredItems.map((item) => ({
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

    // Plan bars에 Alignment 상태 계산
    // (모의 DraftBar 형식으로 변환하여 계산)
    const mockBars: DraftBar[] = plans.map((p) => ({
      clientUid: p.id,
      rowId: `${p.project}::${p.module}::${p.feature}`,
      serverId: p.id,
      title: p.title,
      stage: p.stage,
      status: p.status as any,
      startDate: p.startDate,
      endDate: p.endDate,
      assignees: p.assignees.map((a) => ({
        userId: a.userId,
        role: a.role as any,
        displayName: a.displayName,
      })),
      dirty: false,
      createdAtLocal: new Date().toISOString(),
      updatedAtLocal: new Date().toISOString(),
      isSnapshot: p.isSnapshot,
      metaKey: p.metaKey,
      authorId: p.authorId,
    }));

    // 각 Plan bar에 대해 상태 계산
    return plans.map((plan, index) => {
      if (plan.isSnapshot) {
        return plan;
      }

      const mockBar = mockBars[index];
      const statusInfo = calculateAlignmentStatus(mockBar, mockBars);

      return {
        ...plan,
        alignmentStatus: statusInfo.status,
      };
    });
  }, [filteredItems]);

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
            `계획 ${stats.plansCount} · 스냅샷 ${stats.snapshotsCount}`}
          {filter === "plans" && `계획 ${stats.plansCount}개`}
          {filter === "snapshots" && `스냅샷 ${stats.snapshotsCount}개`}
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
          description="계획과 기록을 Align 해봅니다."
          selectedStages={new Set()}
          selectedAssignees={new Set()}
        />
      </div>
    </div>
  );
}
