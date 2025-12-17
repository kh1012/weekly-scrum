/**
 * Draft Gantt View
 * - 메인 컨테이너
 * - 좌측 Tree + 우측 Timeline
 * - Lock, Commit, Command Palette, Help 통합
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useDraftStore, createRowId } from "./store";
import { useLock } from "./useLock";
import { DraftTreePanel, TREE_WIDTH } from "./DraftTreePanel";
import { DraftTimeline } from "./DraftTimeline";
import { GanttHeader } from "./GanttHeader";
import { CommandPalette } from "./CommandPalette";
import { HelpModal } from "./HelpModal";
import { commitFeaturePlans, fetchFeaturePlans } from "./commitService";
import type { DraftRow, DraftBar, PlanStatus } from "./types";

interface DraftGanttViewProps {
  workspaceId: string;
}

export function DraftGanttView({ workspaceId }: DraftGanttViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const hydrate = useDraftStore((s) => s.hydrate);
  const clearDirtyFlags = useDraftStore((s) => s.clearDirtyFlags);
  const getDirtyBars = useDraftStore((s) => s.getDirtyBars);
  const getDeletedBars = useDraftStore((s) => s.getDeletedBars);
  const bars = useDraftStore((s) => s.bars);
  const rows = useDraftStore((s) => s.rows);
  const isEditing = useDraftStore((s) => s.ui.isEditing);
  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());

  const { startEditing, stopEditing, canEdit } = useLock({ workspaceId });

  // 날짜 범위 (현재 기준 3개월)
  const rangeStart = useRef(new Date());
  const rangeEnd = useRef(new Date());

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    rangeStart.current = start;

    const end = new Date(today);
    end.setMonth(end.getMonth() + 2);
    end.setDate(0);
    rangeEnd.current = end;
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const result = await fetchFeaturePlans(workspaceId);

      if (result.success && result.plans) {
        // Plans를 Rows와 Bars로 변환
        const rowMap = new Map<string, DraftRow>();
        const loadedBars: DraftBar[] = [];

        for (const plan of result.plans) {
          const rowId = createRowId(plan.project, plan.module, plan.feature);

          // Row 생성 (없으면)
          if (!rowMap.has(rowId)) {
            rowMap.set(rowId, {
              rowId,
              project: plan.project,
              module: plan.module,
              feature: plan.feature,
              domain: plan.domain,
              orderIndex: rowMap.size,
              expanded: true,
            });
          }

          // Bar 생성
          loadedBars.push({
            clientUid: plan.clientUid,
            rowId,
            serverId: plan.id,
            title: plan.title,
            stage: plan.stage,
            status: plan.status as PlanStatus,
            startDate: plan.startDate,
            endDate: plan.endDate,
            assignees: [],
            dirty: false,
            deleted: false,
            createdAtLocal: new Date().toISOString(),
            updatedAtLocal: new Date().toISOString(),
          });
        }

        hydrate(Array.from(rowMap.values()), loadedBars);
      }

      setIsLoading(false);
    };

    loadData();
  }, [workspaceId, hydrate]);

  // 커밋 핸들러
  const handleCommit = useCallback(async () => {
    setIsCommitting(true);

    try {
      const dirtyBars = getDirtyBars();
      const deletedBars = getDeletedBars();

      const allBars = [...dirtyBars, ...deletedBars];

      if (allBars.length === 0) {
        setIsCommitting(false);
        return;
      }

      // Bar에서 Row 정보 추출
      const payload = {
        workspaceId,
        plans: allBars.map((bar) => {
          const row = rows.find((r) => r.rowId === bar.rowId);
          return {
            clientUid: bar.clientUid,
            domain: row?.domain,
            project: row?.project || "",
            module: row?.module || "",
            feature: row?.feature || "",
            title: bar.title,
            stage: bar.stage,
            status: bar.status,
            start_date: bar.startDate,
            end_date: bar.endDate,
            assignees: bar.assignees,
            deleted: bar.deleted || false,
          };
        }),
      };

      const result = await commitFeaturePlans(payload);

      if (result.success) {
        clearDirtyFlags();
        alert(`저장 완료: ${result.upsertedCount}개 저장, ${result.deletedCount}개 삭제`);
      } else {
        alert(`저장 실패: ${result.error}`);
      }
    } catch (err) {
      console.error("[handleCommit] Error:", err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsCommitting(false);
    }
  }, [workspaceId, getDirtyBars, getDeletedBars, rows, clearDirtyFlags]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isEditing && hasUnsavedChanges) {
          handleCommit();
        }
        return;
      }

      // ?: Help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, hasUnsavedChanges, handleCommit]);

  // Unsaved changes 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: "var(--notion-bg)" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
            데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden border"
      style={{
        background: "var(--notion-bg)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* 헤더 */}
      <GanttHeader
        workspaceId={workspaceId}
        onCommit={handleCommit}
        onOpenHelp={() => setShowHelp(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        isCommitting={isCommitting}
      />

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 Tree */}
        <DraftTreePanel
          isEditing={isEditing}
          filterOptions={{
            projects: [...new Set(rows.map((r) => r.project))],
            modules: [...new Set(rows.map((r) => r.module))],
            features: [...new Set(rows.map((r) => r.feature))],
            stages: [...new Set(bars.map((b) => b.stage))],
          }}
        />

        {/* 우측 Timeline */}
        <DraftTimeline
          rangeStart={rangeStart.current}
          rangeEnd={rangeEnd.current}
          isEditing={isEditing}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onStartEditing={startEditing}
        onStopEditing={stopEditing}
        onCommit={handleCommit}
        onOpenHelp={() => setShowHelp(true)}
        isEditing={isEditing}
        canEdit={canEdit}
      />

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

