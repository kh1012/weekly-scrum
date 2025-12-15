"use client";

/**
 * 스냅샷 관리 메인 뷰
 * 
 * 이 화면에서 다루는 데이터는 전부 "임시 작업 공간용 상태"입니다.
 * 나중에 실제 저장 기능이 필요할 때 연결할 수 있도록 설계되었습니다.
 */

import { useState, useCallback, useEffect } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { ManageEntryScreen } from "./ManageEntryScreen";
import { ManageEditorScreen } from "./ManageEditorScreen";
import { ToastProvider } from "./Toast";
import type { ManageState, TempSnapshot } from "./types";
import { createEmptySnapshot, convertToTempSnapshot } from "./types";

// SNB 상태 감지를 위한 로컬 스토리지 키
const SIDEBAR_STATE_KEY = "sidebar-open";

const initialState: ManageState = {
  screen: "entry",
  snapshots: [],
  selectedId: null,
};

export function ManageView() {
  const [state, setState] = useState<ManageState>(initialState);
  const { allData, weeks } = useScrumContext();
  
  // SNB 상태 감지
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  useEffect(() => {
    // 초기 상태 로드
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (stored !== null) {
      setIsSidebarOpen(stored === "true");
    }
    
    // 스토리지 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STATE_KEY && e.newValue !== null) {
        setIsSidebarOpen(e.newValue === "true");
      }
    };
    
    // 주기적 폴링 (같은 탭 내 변경 감지)
    const interval = setInterval(() => {
      const current = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (current !== null) {
        setIsSidebarOpen(current === "true");
      }
    }, 500);
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 새로 작성하기
  const handleNewSnapshot = useCallback(() => {
    const newSnapshot = createEmptySnapshot();
    setState((prev) => ({
      ...prev,
      screen: "editor",
      snapshots: [newSnapshot],
      selectedId: newSnapshot.tempId,
    }));
  }, []);

  // 데이터 불러오기 완료
  const handleLoadData = useCallback(
    (selectedNames: Set<string>, selectedWeeks: Set<string>) => {
      const loadedSnapshots: TempSnapshot[] = [];
      const existingKeys = new Set<string>();

      selectedWeeks.forEach((weekKey) => {
        const weekData = allData[weekKey];
        if (!weekData) return;

        weekData.items.forEach((item) => {
          if (selectedNames.has(item.name)) {
            const key = `${weekKey}-${item.name}-${item.topic || ""}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              loadedSnapshots.push(convertToTempSnapshot(item, weekKey));
            }
          }
        });
      });

      if (loadedSnapshots.length > 0) {
        setState((prev) => ({
          ...prev,
          screen: "editor",
          snapshots: [...prev.snapshots, ...loadedSnapshots],
          selectedId: prev.selectedId || loadedSnapshots[0].tempId,
        }));
      }
    },
    [allData]
  );

  // 빈 카드 추가
  const handleAddEmpty = useCallback(() => {
    const newSnapshot = createEmptySnapshot();
    setState((prev) => ({
      ...prev,
      snapshots: [...prev.snapshots, newSnapshot],
      selectedId: newSnapshot.tempId,
    }));
  }, []);

  // 카드 선택
  const handleSelectCard = useCallback((tempId: string) => {
    setState((prev) => ({ ...prev, selectedId: tempId }));
  }, []);

  // 카드 삭제
  const handleDeleteCard = useCallback((tempId: string) => {
    setState((prev) => {
      const newSnapshots = prev.snapshots.filter((s) => s.tempId !== tempId);
      let newSelectedId = prev.selectedId;
      
      if (prev.selectedId === tempId) {
        newSelectedId = newSnapshots.length > 0 ? newSnapshots[0].tempId : null;
      }

      return {
        ...prev,
        snapshots: newSnapshots,
        selectedId: newSelectedId,
        screen: newSnapshots.length === 0 ? "entry" : prev.screen,
      };
    });
  }, []);

  // 카드 복제
  const handleDuplicateCard = useCallback((tempId: string) => {
    setState((prev) => {
      const target = prev.snapshots.find((s) => s.tempId === tempId);
      if (!target) return prev;

      const now = new Date();
      const duplicated: TempSnapshot = {
        ...target,
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isOriginal: false,
        isDirty: true,
        createdAt: now,
        updatedAt: now,
        // 깊은 복사
        pastWeek: {
          ...target.pastWeek,
          tasks: target.pastWeek.tasks.map((t) => ({ ...t })),
          risk: target.pastWeek.risk ? [...target.pastWeek.risk] : null,
          collaborators: target.pastWeek.collaborators.map((c) => ({
            ...c,
            relations: c.relations ? [...c.relations] : undefined,
          })),
        },
        thisWeek: {
          tasks: [...target.thisWeek.tasks],
        },
      };

      // 복제된 카드를 원본 바로 아래에 삽입
      const targetIndex = prev.snapshots.findIndex((s) => s.tempId === tempId);
      const newSnapshots = [...prev.snapshots];
      newSnapshots.splice(targetIndex + 1, 0, duplicated);

      return {
        ...prev,
        snapshots: newSnapshots,
        selectedId: duplicated.tempId,
      };
    });
  }, []);

  // 카드 업데이트
  const handleUpdateCard = useCallback((tempId: string, updates: Partial<TempSnapshot>) => {
    setState((prev) => ({
      ...prev,
      snapshots: prev.snapshots.map((s) =>
        s.tempId === tempId
          ? { ...s, ...updates, isDirty: true, updatedAt: new Date() }
          : s
      ),
    }));
  }, []);

  // 초기 화면으로 돌아가기
  const handleBackToEntry = useCallback(() => {
    setState(initialState);
  }, []);

  // 이름 목록 추출
  const allNames = Array.from(
    new Set(
      Object.values(allData).flatMap((data) => data.items.map((item) => item.name))
    )
  ).sort();

  // 주차 목록
  const weekOptions = weeks.map((w) => ({
    key: w.key,
    label: w.label,
    range: allData[w.key]?.range || "",
  }));

  if (state.screen === "entry") {
    return (
      <ManageEntryScreen
        allNames={allNames}
        weekOptions={weekOptions}
        allData={allData}
        onNewSnapshot={handleNewSnapshot}
        onLoadData={handleLoadData}
      />
    );
  }

  const selectedSnapshot = state.snapshots.find((s) => s.tempId === state.selectedId) || null;

  return (
    <ToastProvider>
      <ManageEditorScreen
        snapshots={state.snapshots}
        selectedSnapshot={selectedSnapshot}
        isSidebarOpen={isSidebarOpen}
        onSelectCard={handleSelectCard}
        onDeleteCard={handleDeleteCard}
        onDuplicateCard={handleDuplicateCard}
        onUpdateCard={handleUpdateCard}
        onAddEmpty={handleAddEmpty}
        onBackToEntry={handleBackToEntry}
      />
    </ToastProvider>
  );
}

