/**
 * Gantt Header
 * - 락 상태 표시
 * - 작업 시작/종료 버튼
 * - 저장(Commit) 버튼
 */

"use client";

import { useDraftStore } from "./store";
import { useLock } from "./useLock";
import {
  LockClosedIcon,
  LockOpenIcon,
  SaveIcon,
  PlayIcon,
  StopIcon,
  RefreshIcon,
  UndoIcon,
  RedoIcon,
  HelpIcon,
} from "@/components/common/Icons";

interface GanttHeaderProps {
  workspaceId: string;
  onCommit: () => Promise<void>;
  onOpenHelp: () => void;
  onOpenCommandPalette: () => void;
  isCommitting?: boolean;
}

export function GanttHeader({
  workspaceId,
  onCommit,
  onOpenHelp,
  onOpenCommandPalette,
  isCommitting = false,
}: GanttHeaderProps) {
  const {
    lockState,
    isMyLock,
    canEdit,
    startEditing,
    stopEditing,
    refreshLockState,
    remainingSeconds,
  } = useLock({ workspaceId });

  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());
  const canUndo = useDraftStore((s) => s.canUndo());
  const canRedo = useDraftStore((s) => s.canRedo());
  const undo = useDraftStore((s) => s.undo);
  const redo = useDraftStore((s) => s.redo);
  const isEditing = useDraftStore((s) => s.ui.isEditing);

  const handleStartEditing = async () => {
    const success = await startEditing();
    if (!success && lockState.isLocked && !lockState.isMyLock) {
      alert(
        `현재 ${lockState.lockedByName || "다른 사용자"}님이 작업 중입니다.\n작업 완료 전까지 편집이 불가합니다.`
      );
    }
  };

  const handleStopEditing = async () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(
        "저장되지 않은 변경 사항이 있습니다.\n작업을 종료하시겠습니까?"
      );
      if (!confirmed) return;
    }
    await stopEditing();
  };

  const handleCommit = async () => {
    await onCommit();
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{
        background: "var(--notion-bg-secondary)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* 좌측: 제목 + 락 상태 */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold" style={{ color: "var(--notion-text)" }}>
          Feature 계획 간트
        </h1>

        {/* 락 상태 표시 */}
        <div className="flex items-center gap-2">
          {lockState.isLocked ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
              style={{
                background: isMyLock
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: isMyLock ? "#22c55e" : "#ef4444",
              }}
            >
              <LockClosedIcon className="w-3.5 h-3.5" />
              {isMyLock ? (
                <span>작업 중 (만료까지 {remainingSeconds}초)</span>
              ) : (
                <span>{lockState.lockedByName || "다른 사용자"}님 작업 중</span>
              )}
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
              style={{
                background: "rgba(107, 114, 128, 0.1)",
                color: "#6b7280",
              }}
            >
              <LockOpenIcon className="w-3.5 h-3.5" />
              <span>편집 가능</span>
            </div>
          )}

          <button
            onClick={refreshLockState}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="락 상태 새로고침"
          >
            <RefreshIcon className="w-4 h-4" style={{ color: "var(--notion-text-muted)" }} />
          </button>
        </div>
      </div>

      {/* 우측: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        {isEditing && (
          <>
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="실행 취소 (⌘Z)"
            >
              <UndoIcon className="w-4 h-4" style={{ color: "var(--notion-text-muted)" }} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="다시 실행 (⌘⇧Z)"
            >
              <RedoIcon className="w-4 h-4" style={{ color: "var(--notion-text-muted)" }} />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}

        {/* 작업 시작/종료 */}
        {!isEditing ? (
          <button
            onClick={handleStartEditing}
            disabled={lockState.isLocked && !isMyLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--notion-blue)",
              color: "white",
            }}
          >
            <PlayIcon className="w-4 h-4" />
            작업 시작
          </button>
        ) : (
          <>
            {/* 저장 버튼 */}
            <button
              onClick={handleCommit}
              disabled={!hasUnsavedChanges || isCommitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasUnsavedChanges ? "#22c55e" : "var(--notion-bg-tertiary)",
                color: hasUnsavedChanges ? "white" : "var(--notion-text-muted)",
              }}
            >
              <SaveIcon className="w-4 h-4" />
              {isCommitting ? "저장 중..." : "저장"}
              {hasUnsavedChanges && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-white/20">
                  변경됨
                </span>
              )}
            </button>

            {/* 작업 종료 */}
            <button
              onClick={handleStopEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: "var(--notion-bg-tertiary)",
                color: "var(--notion-text)",
              }}
            >
              <StopIcon className="w-4 h-4" />
              작업 종료
            </button>
          </>
        )}

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* 도움말/커맨드 팔레트 */}
        <button
          onClick={onOpenCommandPalette}
          className="px-2 py-1.5 rounded-md text-xs font-mono transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: "var(--notion-text-muted)" }}
          title="커맨드 팔레트 (⌘K)"
        >
          ⌘K
        </button>
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="도움말"
        >
          <HelpIcon className="w-4 h-4" style={{ color: "var(--notion-text-muted)" }} />
        </button>
      </div>
    </div>
  );
}

