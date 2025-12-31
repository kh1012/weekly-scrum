"use client";

import React, { useRef, useEffect, useState } from "react";
import type { SnapshotViewMode } from "./types";

export type DisplayMode = "card" | "list";
export type ExportFormat = "csv" | "json";

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
  onExport?: (format: ExportFormat) => void;
}

// 아이콘 컴포넌트들
const AllIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const PersonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

// 뷰 모드 배열
const VIEW_MODES: Array<{ key: SnapshotViewMode; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "전체 보기", icon: <AllIcon /> },
  { key: "person", label: "사람별 보기", icon: <PersonIcon /> },
  { key: "continuity", label: "연속성 분석", icon: <LinkIcon /> },
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
  onExport,
}: SnapshotToolbarProps) {
  // 탭 인디케이터 위치/크기 계산
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  // Export 드롭다운 상태
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

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
  
  // Export 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!showExportDropdown) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportDropdown]);
  
  // Export 핸들러
  const handleExport = (format: ExportFormat) => {
    onExport?.(format);
    setShowExportDropdown(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 animate-slide-in-left">
      {/* 뷰 모드 탭 */}
      <div 
        ref={tabsRef}
        className="relative flex items-center gap-1 p-1 bg-[#f6f8fa] rounded-md border border-[#d0d7de]"
      >
        {/* 슬라이딩 인디케이터 */}
        <div
          className="absolute bg-white border border-[#d0d7de] rounded tab-indicator"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            top: 4,
            bottom: 4,
          }}
        />
        
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onViewModeChange(mode.key)}
            className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === mode.key ? "text-[#0969da]" : "text-[#57606a]"
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center gap-3 ml-auto animate-slide-in-right">
        {/* 비교 기능 */}
        {compareCount > 0 && (
          <div className="flex items-center gap-2 animate-bounce-in">
            <span className="text-xs font-medium px-2 py-1 rounded bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]">
              {compareCount}개 선택
            </span>
            <button
              onClick={onClearCompare}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6] transition-colors"
            >
              취소
            </button>
            {compareCount >= 2 && (
              <button
                onClick={onOpenCompare}
                className="px-4 py-2 rounded-md text-xs font-medium bg-[#0969da] text-white hover:bg-[#0860ca] transition-colors"
              >
                🔍 비교하기
              </button>
            )}
          </div>
        )}

        {/* 선택 모드 토글 */}
        <button
          onClick={onToggleSelectMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors h-[42px] ${
            isSelectMode 
              ? "bg-[#ddf4ff] text-[#0969da] border border-[#0969da]" 
              : "bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6]"
          }`}
          title="선택 모드 (카드를 클릭하여 선택)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>선택</span>
        </button>
        
        {/* 데이터 추출 버튼 */}
        {onExport && (
          <div ref={exportButtonRef} className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors h-[42px] bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6]"
              title="데이터 추출"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>추출</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Export 드롭다운 */}
            {showExportDropdown && (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-50 w-40 rounded-md overflow-hidden animate-fadeIn bg-white border border-[#d0d7de]"
                style={{
                  boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
                }}
              >
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-[#24292f] hover:bg-[#f6f8fa] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV로 저장
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-[#24292f] hover:bg-[#f6f8fa] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  JSON으로 저장
                </button>
              </div>
            )}
          </div>
        )}

        {/* 카드/리스트 토글 */}
        <div className="flex items-center border border-[#d0d7de] rounded-md overflow-hidden">
          <button
            onClick={() => onDisplayModeChange("card")}
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              displayMode === "card" ? "bg-[#0969da] text-white" : "bg-white text-[#57606a] hover:bg-[#f6f8fa]"
            }`}
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
            className={`flex items-center justify-center w-9 h-9 transition-colors border-l border-[#d0d7de] ${
              displayMode === "list" ? "bg-[#0969da] text-white" : "bg-white text-[#57606a] hover:bg-[#f6f8fa]"
            }`}
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
