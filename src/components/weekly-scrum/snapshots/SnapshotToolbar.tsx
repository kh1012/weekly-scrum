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
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
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
  isSelectMode,
  onToggleSelectMode,
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
    <div className="flex flex-wrap items-center gap-4 animate-slide-in-left">
      {/* 뷰 모드 탭 - 슬라이딩 인디케이터 */}
      <div 
        ref={tabsRef}
        className="relative flex items-center gap-1 p-1.5 rounded-xl"
        style={{ 
          background: "var(--notion-bg-secondary)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* 슬라이딩 인디케이터 */}
        <div
          className="absolute rounded-lg tab-indicator"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            top: 6,
            bottom: 6,
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        />
        
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onViewModeChange(mode.key)}
            className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 interactive-btn"
            style={{
              color: viewMode === mode.key ? "#3b82f6" : "var(--notion-text-muted)",
            }}
          >
            <span className="text-base">{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center gap-3 ml-auto animate-slide-in-right">
        {/* 비교 기능 */}
        {compareCount > 0 && (
          <div className="flex items-center gap-2 animate-bounce-in">
            <span 
              className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ 
                color: "#3b82f6",
                background: "rgba(59, 130, 246, 0.08)",
              }}
            >
              {compareCount}개 선택
            </span>
            <button
              onClick={onClearCompare}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all interactive-btn"
              style={{
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)",
              }}
            >
              취소
            </button>
            {compareCount >= 2 && (
              <button
                onClick={onOpenCompare}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all interactive-btn"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                }}
              >
                🔍 비교하기
              </button>
            )}
          </div>
        )}

        {/* 선택 모드 토글 - 다른 버튼과 높이 맞춤 */}
        <button
          onClick={onToggleSelectMode}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all interactive-btn h-[42px]"
          style={{
            background: isSelectMode 
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))" 
              : "var(--notion-bg-secondary)",
            color: isSelectMode ? "#3b82f6" : "var(--notion-text-muted)",
            border: isSelectMode ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid transparent",
            boxShadow: isSelectMode ? "0 2px 8px rgba(59, 130, 246, 0.1)" : "none",
          }}
          title="선택 모드 (카드를 클릭하여 선택)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>선택</span>
        </button>

        {/* 카드/리스트 토글 */}
        <div 
          className="flex items-center gap-1 p-1.5 rounded-xl" 
          style={{ 
            background: "var(--notion-bg-secondary)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <button
            onClick={() => onDisplayModeChange("card")}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all interactive-btn"
            style={{
              background: displayMode === "card" ? "white" : "transparent",
              color: displayMode === "card" ? "#3b82f6" : "var(--notion-text-muted)",
              boxShadow: displayMode === "card" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
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
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all interactive-btn"
            style={{
              background: displayMode === "list" ? "white" : "transparent",
              color: displayMode === "list" ? "#3b82f6" : "var(--notion-text-muted)",
              boxShadow: displayMode === "list" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
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
