/**
 * DraftTimeline 키보드 이벤트 처리
 */

import { useEffect } from "react";

interface UseTimelineKeyboardProps {
  isEditing: boolean;
  selectedBarId: string | undefined;
  selectedFlagId: string | null;
  deleteBar: (clientUid: string) => void;
  selectBar: (clientUid: string | undefined) => void;
  deleteFlagAction: (flagId: string) => void;
  selectFlag: (flagId: string | null) => void;
  clearPendingFlag: () => void;
  setHighlightDateRange: (range: any) => void;
  setLaneContextMenu: (menu: any) => void;
}

export function useTimelineKeyboard({
  isEditing,
  selectedBarId,
  selectedFlagId,
  deleteBar,
  selectBar,
  deleteFlagAction,
  selectFlag,
  clearPendingFlag,
  setHighlightDateRange,
  setLaneContextMenu,
}: UseTimelineKeyboardProps) {
  // 전역 키보드 이벤트 (Delete/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      // 입력 필드에서는 무시
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // Flag 선택 시 flag 삭제
        if (selectedFlagId) {
          deleteFlagAction(selectedFlagId);
          selectFlag(null);
          setHighlightDateRange(null); // 기간 강조도 함께 해제
        }
        // Bar 선택 시 bar 삭제
        else if (selectedBarId) {
          deleteBar(selectedBarId);
          selectBar(undefined);
        }
      } else if (e.key === "Escape") {
        selectBar(undefined);
        selectFlag(null);
        clearPendingFlag();
        setHighlightDateRange(null); // 기간 강조 해제
        setLaneContextMenu(null); // 컨텍스트 메뉴 닫기
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditing,
    selectedBarId,
    selectedFlagId,
    deleteBar,
    selectBar,
    deleteFlagAction,
    selectFlag,
    clearPendingFlag,
    setHighlightDateRange,
    setLaneContextMenu,
  ]);
}

