/**
 * DraftTimeline 레인 추가/삭제 액션
 */

import { useCallback, useEffect } from "react";
import { assignLanesToBars, parseLocalDate } from "../laneLayout";
import type { DraftRow, DraftBar as DraftBarType } from "../types";
import type { LaneContextMenuState, DeleteLaneConfirmState } from "./timelineTypes";

interface UseTimelineLaneActionsProps {
  rows: DraftRow[];
  activeBars: DraftBarType[];
  rangeStart: Date;
  rangeEnd: Date;
  laneContextMenu: LaneContextMenuState | null;
  deleteLaneConfirm: DeleteLaneConfirmState | null;
  updateBar: (clientUid: string, updates: any) => void;
  setLaneContextMenu: (menu: LaneContextMenuState | null) => void;
  setDeleteLaneConfirm: (confirm: DeleteLaneConfirmState | null) => void;
  onAction?: () => void;
}

export function useTimelineLaneActions({
  rows,
  activeBars,
  rangeStart,
  rangeEnd,
  laneContextMenu,
  deleteLaneConfirm,
  updateBar,
  setLaneContextMenu,
  setDeleteLaneConfirm,
  onAction,
}: UseTimelineLaneActionsProps) {
  // 레인 추가 핸들러
  const handleAddLane = useCallback(
    (position: "above" | "below") => {
      if (!laneContextMenu) return;

      const { rowId, laneIndex } = laneContextMenu;
      const row = rows.find((r) => r.rowId === rowId);
      if (!row) return;

      // 해당 row의 bars 가져오기
      const rowBars = activeBars.filter((b) => b.rowId === rowId);

      // 현재 bars의 실제 레인 인덱스 계산 (assignLanesToBars 사용)
      const barsWithLane = assignLanesToBars(rowBars);

      // 새로운 레인 인덱스 계산
      const newLaneIndex = position === "above" ? laneIndex : laneIndex + 1;

      // 각 bar의 실제 레인 인덱스를 확인하고 preferredLane 설정
      barsWithLane.forEach((barWithLane) => {
        const currentLane = barWithLane.lane;

        // newLaneIndex 이상의 레인: 1 증가
        if (currentLane >= newLaneIndex) {
          updateBar(barWithLane.clientUid, {
            preferredLane: currentLane + 1,
          });
        }
        // newLaneIndex 미만의 레인: 현재 위치 고정 (preferredLane 설정)
        else {
          // preferredLane이 없거나, 현재 레인과 다른 경우 현재 레인으로 고정
          if (
            barWithLane.preferredLane === undefined ||
            barWithLane.preferredLane !== currentLane
          ) {
            updateBar(barWithLane.clientUid, {
              preferredLane: currentLane,
            });
          }
        }
      });

      setLaneContextMenu(null);
      onAction?.();
    },
    [laneContextMenu, rows, activeBars, updateBar, onAction, setLaneContextMenu]
  );

  // 레인 삭제 핸들러
  const handleDeleteLane = useCallback(() => {
    if (!laneContextMenu) return;

    const { rowId, laneIndex } = laneContextMenu;
    const row = rows.find((r) => r.rowId === rowId);
    if (!row) return;

    // 해당 row의 bars 가져오기
    const rowBars = activeBars.filter((b) => b.rowId === rowId);

    // 현재 bars의 실제 레인 인덱스 계산
    const barsWithLane = assignLanesToBars(rowBars);

    // 삭제할 레인에 있는 bars 확인
    const barsInLane = barsWithLane.filter((b) => b.lane === laneIndex);

    // 현재 보이는 날짜 범위에 있는 bars가 있는지 확인
    const visibleBars = barsInLane.filter((bar) => {
      const barStart = parseLocalDate(bar.startDate);
      const barEnd = parseLocalDate(bar.endDate);
      return barStart <= rangeEnd && barEnd >= rangeStart;
    });

    if (visibleBars.length > 0) {
      // 모달 표시
      setDeleteLaneConfirm({
        rowId,
        laneIndex,
        visibleBarsCount: visibleBars.length,
      });
      setLaneContextMenu(null);
      return;
    }

    // bars가 없으면 바로 삭제
    performDeleteLane(rowId, laneIndex, barsWithLane, barsInLane);
  }, [
    laneContextMenu,
    rows,
    activeBars,
    rangeStart,
    rangeEnd,
    setDeleteLaneConfirm,
    setLaneContextMenu,
  ]);

  // 레인 삭제 실행
  const performDeleteLane = useCallback(
    (
      rowId: string,
      laneIndex: number,
      barsWithLane: ReturnType<typeof assignLanesToBars>,
      barsInLane: ReturnType<typeof assignLanesToBars>
    ) => {
      // 삭제할 레인의 bars의 preferredLane 제거
      barsInLane.forEach((bar) => {
        updateBar(bar.clientUid, {
          preferredLane: undefined,
        });
      });

      // laneIndex보다 큰 레인의 bars의 preferredLane을 1 감소
      barsWithLane.forEach((barWithLane) => {
        const currentLane = barWithLane.lane;
        if (currentLane > laneIndex) {
          updateBar(barWithLane.clientUid, {
            preferredLane: currentLane - 1,
          });
        }
      });

      setLaneContextMenu(null);
      setDeleteLaneConfirm(null);
      onAction?.();
    },
    [updateBar, onAction, setLaneContextMenu, setDeleteLaneConfirm]
  );

  // 레인 삭제 확인 핸들러
  const handleConfirmDeleteLane = useCallback(() => {
    if (!deleteLaneConfirm) return;

    const { rowId, laneIndex } = deleteLaneConfirm;
    const rowBars = activeBars.filter((b) => b.rowId === rowId);
    const barsWithLane = assignLanesToBars(rowBars);
    const barsInLane = barsWithLane.filter((b) => b.lane === laneIndex);

    performDeleteLane(rowId, laneIndex, barsWithLane, barsInLane);
  }, [deleteLaneConfirm, activeBars, performDeleteLane]);

  // 레인 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!laneContextMenu) return;

    const handleClickOutside = () => {
      setLaneContextMenu(null);
    };

    const handleContextMenu = () => {
      setLaneContextMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [laneContextMenu, setLaneContextMenu]);

  return {
    handleAddLane,
    handleDeleteLane,
    handleConfirmDeleteLane,
    performDeleteLane,
  };
}

