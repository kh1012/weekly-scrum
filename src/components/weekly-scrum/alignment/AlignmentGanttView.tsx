/**
 * AlignmentGanttView - Alignment 전용 Gantt Chart Wrapper
 * 
 * DraftGanttView를 래핑하여 Alignment 기능을 제공:
 * - Status Coloring (RED/ORANGE/GREEN)
 * - Mismatch Review Panel
 * - Timeline Focus Interaction
 * - Plans + Snapshots 통합 표시
 */

"use client";

import { useMemo, useRef, useCallback } from "react";
import { DraftGanttView, type DraftGanttViewRef } from "@/components/plans/gantt-draft/DraftGanttView";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";
import { calculateAlignmentStatus, detectAlignmentMismatches } from "@/lib/alignment/alignmentStatus";
import type { DraftBar } from "@/components/plans/gantt-draft/types";
import type { AlignmentMismatch } from "@/lib/alignment/alignmentStatus";
import { MismatchReviewPanel } from "./MismatchReviewPanel";

export interface AlignmentGanttViewProps {
  /** Workspace ID */
  workspaceId: string;
  
  /** Alignment items (Plans + Snapshots) */
  items: AlignmentGanttItem[];
  
  /** Workspace members */
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;
  
  /** Gantt chart title */
  title: string;
  
  /** Gantt chart description (optional) */
  description?: string;
  
  /** Show mismatch review panel (default: true) */
  showMismatchReview?: boolean;
}

/**
 * AlignmentGanttView Component
 * 
 * Alignment 기능에 특화된 Gantt Chart 래퍼 컴포넌트
 * Plans와 Alignment가 공통으로 사용하는 DraftGanttView를 래핑하여
 * Alignment 고유 기능을 제공합니다.
 */
export function AlignmentGanttView({
  workspaceId,
  items,
  members,
  title,
  description = "계획과 기록을 Align 해봅니다.",
  showMismatchReview = true,
}: AlignmentGanttViewProps) {
  const ganttRef = useRef<DraftGanttViewRef>(null);

  /**
   * AlignmentGanttItem을 InitialPlan 형식으로 변환하고 Status 계산
   */
  const { initialPlans, mismatches } = useMemo(() => {
    // 1. AlignmentGanttItem → InitialPlan 변환
    const plans = items.map((item) => {
      const plan = {
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
      };

      // 디버그: 스냅샷 아이템 확인
      if (item.type === "snapshot") {
        console.log('[AlignmentGanttView] Converting snapshot item to InitialPlan:', {
          id: item.id,
          title: item.title,
          year: item.year,
          week: item.week,
          authorName: item.authorName,
          authorId: item.authorId,
          hasPastWeek: !!item.past_week,
          hasThisWeek: !!item.this_week,
          pastWeekTasks: item.past_week?.tasks?.length || 0,
          thisWeekTasks: item.this_week?.tasks?.length || 0,
        });
      }

      return plan;
    });

    // 2. DraftBar 형식으로 변환 (Status 계산용)
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

    // 3. Plan bars에 대해 Alignment 상태 계산
    const plansWithStatus = plans.map((plan, index) => {
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

    // 4. Mismatch 검출
    const planBars = mockBars.filter((bar) => !bar.isSnapshot);
    const detectedMismatches = detectAlignmentMismatches(planBars, mockBars);

    return {
      initialPlans: plansWithStatus,
      mismatches: detectedMismatches,
    };
  }, [items]);

  /**
   * Mismatch 클릭 시 Timeline Focus 핸들러
   */
  const handleFocusMismatch = useCallback((mismatch: AlignmentMismatch) => {
    // metaPath format: "Project / Module / Feature"
    const parts = mismatch.metaPath.split(" / ");
    const rowId = parts.join("::");
    
    // Scroll to the row and highlight
    ganttRef.current?.scrollToRow(rowId, { highlight: true, smooth: true });
  }, []);

  return (
    <div className="relative h-full">
      {/* Mismatch Review Panel */}
      {showMismatchReview && (
        <MismatchReviewPanel
          mismatches={mismatches}
          onFocusMismatch={handleFocusMismatch}
        />
      )}

      {/* Gantt Chart */}
      <DraftGanttView
        ref={ganttRef}
        workspaceId={workspaceId}
        initialPlans={initialPlans}
        members={members}
        readOnly={true}
        title={title}
        description={description}
        selectedStages={new Set()}
        selectedAssignees={new Set()}
      />
    </div>
  );
}

