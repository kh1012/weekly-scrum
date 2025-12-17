/**
 * Floating Dock (하단 도킹 영역)
 * - 보조 액션: Undo/Redo, 새로고침, 커맨드 팔레트
 * - 기간 데이터 이동 시 실시간 일자 표시
 * - Airbnb 스타일 글래스모피즘
 */

"use client";

import { UndoIcon, RedoIcon, RefreshIcon, HelpIcon } from "@/components/common/Icons";
import { useDraftStore } from "./store";

interface FloatingDockProps {
  onUndo: () => void;
  onRedo: () => void;
  onRefresh: () => void;
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isEditing: boolean;
  /** 드래그 중인 기간 정보 */
  dragInfo?: {
    startDate: string;
    endDate: string;
  } | null;
}

export function FloatingDock({
  onUndo,
  onRedo,
  onRefresh,
  onOpenCommandPalette,
  onOpenHelp,
  canUndo,
  canRedo,
  isEditing,
  dragInfo,
}: FloatingDockProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-2xl shadow-lg backdrop-blur-xl border"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          borderColor: "rgba(0, 0, 0, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* 드래그 중 기간 표시 */}
        {dragInfo && (
          <>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "white",
              }}
            >
              <span className="text-xs opacity-80">📅</span>
              <span>{dragInfo.startDate}</span>
              <span className="opacity-60">→</span>
              <span>{dragInfo.endDate}</span>
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1" />
          </>
        )}

        {/* Undo/Redo */}
        {isEditing && (
          <>
            <DockButton
              icon={<UndoIcon className="w-4 h-4" />}
              onClick={onUndo}
              disabled={!canUndo}
              tooltip="실행 취소 (⌘Z)"
            />
            <DockButton
              icon={<RedoIcon className="w-4 h-4" />}
              onClick={onRedo}
              disabled={!canRedo}
              tooltip="다시 실행 (⌘⇧Z)"
            />
            <div className="w-px h-5 bg-gray-200 mx-1" />
          </>
        )}

        {/* 새로고침 */}
        <DockButton
          icon={<RefreshIcon className="w-4 h-4" />}
          onClick={onRefresh}
          tooltip="락 상태 새로고침"
        />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* 커맨드 팔레트 */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-gray-100"
          style={{ color: "#6b7280" }}
        >
          <span>⌘K</span>
        </button>

        {/* 도움말 */}
        <DockButton
          icon={<HelpIcon className="w-4 h-4" />}
          onClick={onOpenHelp}
          tooltip="도움말"
        />
      </div>
    </div>
  );
}

interface DockButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

function DockButton({ icon, onClick, disabled, tooltip }: DockButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-xl transition-all hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: "#6b7280" }}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

