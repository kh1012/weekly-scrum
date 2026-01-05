"use client";

import { useState, useMemo, useRef } from "react";
import { DraftGanttView, type DraftGanttViewRef } from "@/components/plans/gantt-draft/DraftGanttView";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";
import { calculateAlignmentStatus, detectAlignmentMismatches } from "@/lib/alignment/alignmentStatus";
import type { DraftBar } from "@/components/plans/gantt-draft/types";
import type { AlignmentMismatch } from "@/lib/alignment/alignmentStatus";
import { MismatchReviewPanel } from "@/components/weekly-scrum/alignment/MismatchReviewPanel";

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
  const ganttRef = useRef<DraftGanttViewRef>(null);

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

  // AlignmentGanttItem을 InitialPlan 형식으로 변환 + 상태 계산
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

    // 각 Plan bar에 대해 상태 계산 (workspace-wide, no user filter)
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
    const snapshotsCount = items.filter((item) => item.type === "snapshot").length;
    const uniqueAuthors = new Set(
      items
        .filter((item) => item.type === "snapshot" && item.authorName)
        .map((item) => item.authorName)
    ).size;
    return { plansCount, snapshotsCount, uniqueAuthors };
  }, [items]);

  // Mismatch 감지
  const mismatches = useMemo(() => {
    const mockBars: DraftBar[] = filteredItems.map((item) => ({
      clientUid: item.id,
      rowId: `${item.project}::${item.module}::${item.feature}`,
      serverId: item.id,
      title: item.title,
      stage: item.stage || "in_progress",
      status: (item.status || "active") as any,
      startDate: item.start_date,
      endDate: item.end_date,
      assignees: (item.assignees || []).map((a) => ({
        userId: a.userId,
        role: a.role as any,
        displayName: a.displayName,
      })),
      dirty: false,
      createdAtLocal: new Date().toISOString(),
      updatedAtLocal: new Date().toISOString(),
      isSnapshot: item.type === "snapshot",
      metaKey: item.metaKey,
      authorId: item.authorId,
    }));

    const planBars = mockBars.filter((bar) => !bar.isSnapshot);
    return detectAlignmentMismatches(planBars, mockBars);
  }, [filteredItems]);

  const handleFocusMismatch = (mismatch: AlignmentMismatch) => {
    // Calculate rowId from meta path
    const parts = mismatch.metaPath.split(" / ");
    const rowId = parts.join("::");
    
    // Scroll to the row
    ganttRef.current?.scrollToRow(rowId, { highlight: true, smooth: true });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Mismatch Review Panel */}
      <MismatchReviewPanel
        mismatches={mismatches}
        onFocusMismatch={handleFocusMismatch}
      />

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
          ref={ganttRef}
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

