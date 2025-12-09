"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import type { SnapshotViewMode } from "./types";

export type DisplayMode = "card" | "list";

interface SnapshotToolbarProps {
  viewMode: SnapshotViewMode;
  onViewModeChange: (mode: SnapshotViewMode) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  compareCount: number;
  onOpenCompare: () => void;
  onClearCompare: () => void;
}

// 뷰 모드 배열을 컴포넌트 외부에 정의하여 참조 안정성 확보
const VIEW_MODES: Array<{ key: SnapshotViewMode; label: string; icon: string }> = [
  { key: "all", label: "전체 보기", icon: "📋" },
  { key: "person", label: "사람별 보기", icon: "👤" },
  { key: "continuity", label: "연속성 분석", icon: "🔗" },
];

export function SnapshotToolbar({
  viewMode,
  onViewModeChange,
  displayMode,
  onDisplayModeChange,
  compareCount,
  onOpenCompare,
  onClearCompare,
}: SnapshotToolbarProps) {
  // 탭 인디케이터 위치/크기 계산
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 인디케이터 위치 업데이트
  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return;
      const activeIndex = VIEW_MODES.findIndex((m) => m.key === viewMode);
      const buttons = tabsRef.current.querySelectorAll("button");
      if (buttons[activeIndex]) {
        const button = buttons[activeIndex] as HTMLElement;
        setIndicatorStyle({
          left: button.offsetLeft,
          width: button.offsetWidth,
        });
      }
    };

    updateIndicator();
    
    // 리사이즈 시에도 업데이트
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [viewMode]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* 뷰 모드 탭 - 슬라이딩 인디케이터 */}
      <div 
        ref={tabsRef}
        className="relative flex items-center gap-1 p-1 rounded-lg"
        style={{ background: "white" }}
      >
        {/* 슬라이딩 인디케이터 */}
        <div
          className="absolute rounded-md transition-all duration-200 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            top: 4,
            bottom: 4,
            background: "rgba(59, 130, 246, 0.15)",
          }}
        />
        
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onViewModeChange(mode.key)}
            className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              color: viewMode === mode.key ? "#3b82f6" : "var(--notion-text-muted)",
            }}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center gap-3 ml-auto">
        {/* 비교 기능 */}
        {compareCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
              {compareCount}개 선택됨
            </span>
            <button
              onClick={onClearCompare}
              className="px-2 py-1 rounded text-xs transition-colors"
              style={{
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)",
              }}
            >
              선택 취소
            </button>
            {compareCount >= 2 && (
              <button
                onClick={onOpenCompare}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#3b82f6",
                }}
              >
                🔍 비교하기
              </button>
            )}
          </div>
        )}

        {/* 카드/리스트 토글 */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "white" }}>
          <button
            onClick={() => onDisplayModeChange("card")}
            className="flex items-center justify-center w-7 h-7 rounded transition-all"
            style={{
              background: displayMode === "card" ? "rgba(59, 130, 246, 0.15)" : "transparent",
              color: displayMode === "card" ? "#3b82f6" : "var(--notion-text-muted)",
            }}
            title="카드 보기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
            </svg>
          </button>
          <button
            onClick={() => onDisplayModeChange("list")}
            className="flex items-center justify-center w-7 h-7 rounded transition-all"
            style={{
              background: displayMode === "list" ? "rgba(59, 130, 246, 0.15)" : "transparent",
              color: displayMode === "list" ? "#3b82f6" : "var(--notion-text-muted)",
            }}
            title="리스트 보기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
