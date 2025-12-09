"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { ScrumItem } from "@/types/scrum";
import { useScrumContext } from "@/context/ScrumContext";
import type { SnapshotViewMode, PersonGroup, CompareState } from "./types";
import { SnapshotToolbar, type DisplayMode } from "./SnapshotToolbar";
import { SnapshotAllView } from "./SnapshotAllView";
import { SnapshotPersonView } from "./SnapshotPersonView";
import { SnapshotCompareView } from "./SnapshotCompareView";
import { SnapshotContinuityView } from "./SnapshotContinuityView";

const STORAGE_KEY = "snapshot-viewer-state";

interface StoredState {
  displayMode: DisplayMode;
  isSelectMode?: boolean;
}

/**
 * 스냅샷 뷰어 메인 컴포넌트
 */
export function SnapshotViewer() {
  const { filteredItems, allData, sortedWeekKeys, selectedWeekKey } = useScrumContext();
  
  // 뷰 모드
  const [viewMode, setViewMode] = useState<SnapshotViewMode>("all");
  
  // 디스플레이 모드 (카드/리스트)
  const [displayMode, setDisplayMode] = useState<DisplayMode>("card");
  
  // 선택 모드
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // 비교 상태
  const [compareState, setCompareState] = useState<CompareState>({
    selectedItems: [],
    isCompareMode: false,
  });

  // 초기화 상태
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // localStorage에서 상태 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredState = JSON.parse(stored);
        if (parsed.displayMode) {
          setDisplayMode(parsed.displayMode);
        }
        if (parsed.isSelectMode !== undefined) {
          setIsSelectMode(parsed.isSelectMode);
        }
      }
    } catch {
      // 무시
    }
    setIsInitialized(true);
  }, []);

  // 선택 모드 변경 시 저장
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: StoredState = stored ? JSON.parse(stored) : { displayMode: "card" };
      current.isSelectMode = isSelectMode;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // 무시
    }
  }, [isSelectMode, isInitialized]);

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!contextMenu) return;
    
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // 우클릭 핸들러
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // displayMode 변경 시 저장
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    if (!isInitialized) return; // 초기화 전에는 저장하지 않음
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: StoredState = stored ? JSON.parse(stored) : { displayMode: "card" };
      current.displayMode = mode;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // 무시
    }
  }, [isInitialized]);

  // 사람별 그룹화
  const personGroups = useMemo((): PersonGroup[] => {
    const groups = new Map<string, PersonGroup>();
    
    filteredItems.forEach((item) => {
      if (!groups.has(item.name)) {
        groups.set(item.name, {
          name: item.name,
          items: [],
          domains: [],
          projects: [],
        });
      }
      
      const group = groups.get(item.name)!;
      group.items.push(item);
      
      if (!group.domains.includes(item.domain)) {
        group.domains.push(item.domain);
      }
      if (!group.projects.includes(item.project)) {
        group.projects.push(item.project);
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => 
      a.name.localeCompare(b.name, "ko")
    );
  }, [filteredItems]);

  // 현재 주차 인덱스
  const currentWeekIndex = useMemo(() => {
    return sortedWeekKeys.indexOf(selectedWeekKey);
  }, [sortedWeekKeys, selectedWeekKey]);

  // 이전/다음 주차 데이터
  const prevWeekData = useMemo(() => {
    if (currentWeekIndex <= 0) return null;
    const prevKey = sortedWeekKeys[currentWeekIndex - 1];
    return allData[prevKey] || null;
  }, [allData, sortedWeekKeys, currentWeekIndex]);

  const nextWeekData = useMemo(() => {
    if (currentWeekIndex >= sortedWeekKeys.length - 1) return null;
    const nextKey = sortedWeekKeys[currentWeekIndex + 1];
    return allData[nextKey] || null;
  }, [allData, sortedWeekKeys, currentWeekIndex]);

  // 비교 대상 토글
  const handleCompareToggle = useCallback((item: ScrumItem) => {
    setCompareState((prev) => {
      const isSelected = prev.selectedItems.some(
        (i) => i.name === item.name && i.topic === item.topic && i.project === item.project
      );
      
      if (isSelected) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.filter(
            (i) => !(i.name === item.name && i.topic === item.topic && i.project === item.project)
          ),
        };
      } else {
        return {
          ...prev,
          selectedItems: [...prev.selectedItems, item],
        };
      }
    });
  }, []);

  // 비교 모드 열기
  const handleOpenCompare = useCallback(() => {
    if (compareState.selectedItems.length >= 2) {
      setCompareState((prev) => ({ ...prev, isCompareMode: true }));
      setViewMode("compare");
    }
  }, [compareState.selectedItems.length]);

  // 비교 모드 닫기
  const handleCloseCompare = useCallback(() => {
    setCompareState({ selectedItems: [], isCompareMode: false });
    setViewMode("all");
  }, []);

  // 비교 선택 초기화
  const handleClearCompare = useCallback(() => {
    setCompareState({ selectedItems: [], isCompareMode: false });
  }, []);

  // 선택 모드 토글
  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => !prev);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4" onContextMenu={handleContextMenu}>
      {/* 툴바 */}
      <SnapshotToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
        compareCount={compareState.selectedItems.length}
        onOpenCompare={handleOpenCompare}
        onClearCompare={handleClearCompare}
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
      />

      {/* 뷰 컨텐츠 */}
      {viewMode === "all" && (
        <SnapshotAllView
          items={filteredItems}
          displayMode={displayMode}
          compareState={compareState}
          onCompareToggle={handleCompareToggle}
          isSelectMode={isSelectMode}
        />
      )}

      {viewMode === "person" && (
        <SnapshotPersonView
          personGroups={personGroups}
          displayMode={displayMode}
          compareState={compareState}
          onCompareToggle={handleCompareToggle}
          isSelectMode={isSelectMode}
        />
      )}

      {viewMode === "compare" && (
        <SnapshotCompareView
          items={compareState.selectedItems}
          onClose={handleCloseCompare}
        />
      )}

      {viewMode === "continuity" && (
        <SnapshotContinuityView
          currentItems={filteredItems}
          prevWeekItems={prevWeekData?.items || []}
          nextWeekItems={nextWeekData?.items || []}
          currentWeekKey={selectedWeekKey}
          prevWeekKey={currentWeekIndex > 0 ? sortedWeekKeys[currentWeekIndex - 1] : null}
          nextWeekKey={currentWeekIndex < sortedWeekKeys.length - 1 ? sortedWeekKeys[currentWeekIndex + 1] : null}
        />
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg overflow-hidden animate-fadeIn"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: "var(--notion-bg)",
            boxShadow: "var(--notion-shadow-lg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
            style={{ color: "var(--notion-text)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isSelectMode ? "선택 모드 비활성화" : "선택 모드 활성화"}
          </button>
        </div>
      )}
    </div>
  );
}
