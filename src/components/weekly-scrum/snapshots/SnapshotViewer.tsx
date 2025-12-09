"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  
  // 비교 상태
  const [compareState, setCompareState] = useState<CompareState>({
    selectedItems: [],
    isCompareMode: false,
  });

  // 초기화 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // localStorage에서 상태 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredState = JSON.parse(stored);
        if (parsed.displayMode) {
          setDisplayMode(parsed.displayMode);
        }
      }
    } catch {
      // 무시
    }
    setIsInitialized(true);
  }, []);

  // displayMode 변경 시 저장
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    try {
      const state: StoredState = { displayMode: mode };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 무시
    }
  }, []);

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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 툴바 */}
      <SnapshotToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
        compareCount={compareState.selectedItems.length}
        onOpenCompare={handleOpenCompare}
        onClearCompare={handleClearCompare}
      />

      {/* 뷰 컨텐츠 */}
      {viewMode === "all" && (
        <SnapshotAllView
          items={filteredItems}
          displayMode={displayMode}
          compareState={compareState}
          onCompareToggle={handleCompareToggle}
        />
      )}

      {viewMode === "person" && (
        <SnapshotPersonView
          personGroups={personGroups}
          displayMode={displayMode}
          compareState={compareState}
          onCompareToggle={handleCompareToggle}
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
    </div>
  );
}
