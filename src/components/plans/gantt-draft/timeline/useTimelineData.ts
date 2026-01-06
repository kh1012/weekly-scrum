/**
 * DraftTimeline 데이터 계산 로직
 */

import { useMemo } from "react";
import {
  buildFlatTree,
  buildSummarizedTree,
  calculateNodePositions,
  parseLocalDate,
  assignLanesToBars,
  LANE_HEIGHT,
} from "../laneLayout";
import { filterBarsWithIndex, filterRowsWithIndex } from "../filterCache";
import type { DraftRow, DraftBar as DraftBarType } from "../types";
import type { FilterIndex } from "../filterCache";
import { DAY_WIDTH } from "./timelineTypes";

interface UseTimelineDataProps {
  rangeStart: Date;
  rangeEnd: Date;
  allRows: DraftRow[];
  allBars: DraftBarType[];
  activeBars: DraftBarType[];
  searchQuery: string;
  filters: {
    stages: string[];
    assignees: string[];
    projects: string[];
    modules: string[];
    features: string[];
  };
  filterIndex: FilterIndex | null;
  expandedNodesArray: string[];
  viewMode: "detailed" | "summarized";
}

export function useTimelineData({
  rangeStart,
  rangeEnd,
  allRows,
  allBars,
  activeBars,
  searchQuery,
  filters,
  filterIndex,
  expandedNodesArray,
  viewMode,
}: UseTimelineDataProps) {
  // Set으로 변환 (빠른 조회용)
  const expandedNodes = useMemo(
    () => new Set(expandedNodesArray),
    [expandedNodesArray]
  );

  // 활성 bars (삭제되지 않은 것들 + 필터 적용)
  const filteredActiveBars = useMemo(() => {
    if (filterIndex) {
      // 인덱스를 사용한 고속 필터링
      return filterBarsWithIndex(allBars, filterIndex, {
        stages: filters.stages || [],
        assignees: filters.assignees || [],
      });
    }

    // 폴백: 기존 방식
    let bars = allBars.filter((b) => !b.deleted);

    // 스테이지 필터 적용
    if (filters.stages && filters.stages.length > 0) {
      bars = bars.filter((b) => filters.stages.includes(b.stage));
    }

    // 담당자 필터 적용
    if (filters.assignees && filters.assignees.length > 0) {
      bars = bars.filter((b) => {
        // Snapshot인 경우: authorId로 필터링
        if (b.isSnapshot) {
          return b.authorId && filters.assignees.includes(b.authorId);
        }
        // Plan인 경우: assignees로 필터링
        return b.assignees.some((assignee) =>
          filters.assignees.includes(assignee.userId)
        );
      });
    }

    return bars;
  }, [allBars, filterIndex, filters.stages, filters.assignees]);

  // activeBars를 Set으로 변환 (빠른 조회용)
  const activeBarsSet = useMemo(() => {
    const set = new Set(filteredActiveBars.map((b) => b.clientUid));
    
    return set;
  }, [filteredActiveBars]);

  // 필터링된 rows (useMemo로 캐싱)
  const rows = useMemo(() => {
    if (filterIndex) {
      // 인덱스를 사용한 고속 필터링
      // filteredActiveBars 사용 (담당자/스테이지 필터 반영)
      const barsInView = new Set(filteredActiveBars.map((b) => b.clientUid));
      return filterRowsWithIndex(
        allRows,
        barsInView,
        filterIndex,
        {
          projects: filters.projects || [],
          modules: filters.modules || [],
          features: filters.features || [],
        },
        searchQuery
      );
    }

    // 폴백: 기존 방식
    return allRows.filter((row) => {
      // 로컬에서 생성된 row는 bars 없이도 표시
      // 서버에서 로드된 row는 bars가 있어야 표시
      if (!row.isLocal) {
        // filteredActiveBars 사용 (담당자/스테이지 필터 반영)
        const hasBars = filteredActiveBars.some((b) => b.rowId === row.rowId);
        if (!hasBars) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          row.project.toLowerCase().includes(q) ||
          row.module.toLowerCase().includes(q) ||
          row.feature.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (
        filters.projects.length > 0 &&
        !filters.projects.includes(row.project)
      ) {
        return false;
      }
      if (filters.modules.length > 0 && !filters.modules.includes(row.module)) {
        return false;
      }

      if (
        filters.features.length > 0 &&
        !filters.features.includes(row.feature)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, filteredActiveBars, filterIndex, searchQuery, filters]);

  // 날짜 배열 생성 (rangeStart ~ rangeEnd)
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  // 월 구분선 (첫 번째 날 기준)
  const months = useMemo(() => {
    const result: { month: string; days: number }[] = [];
    let currentMonth = "";
    let currentDays = 0;

    for (const day of days) {
      const monthStr = `${day.getFullYear()}년 ${day.getMonth() + 1}월`;
      if (monthStr !== currentMonth) {
        if (currentMonth) {
          result.push({ month: currentMonth, days: currentDays });
        }
        currentMonth = monthStr;
        currentDays = 1;
      } else {
        currentDays++;
      }
    }
    if (currentMonth) {
      result.push({ month: currentMonth, days: currentDays });
    }
    return result;
  }, [days]);

  const totalWidth = days.length * DAY_WIDTH;

  // 트리 구조 기반 노드 리스트 (좌측 트리와 동기화)
  const flatNodes = useMemo(() => {
    // viewMode에 따라 다른 트리 빌드 함수 사용
    const nodes =
      viewMode === "summarized"
        ? buildSummarizedTree(rows, filteredActiveBars, expandedNodes)
        : buildFlatTree(rows, filteredActiveBars, expandedNodes);

    // 기능 필터: feature 노드만 반환 (detailed 모드에서만 적용)
    if (viewMode === "detailed" && filters.features.length > 0) {
      return nodes.filter((node) => node.type === "feature");
    }
    // 모듈 필터: module, feature 노드만 반환 (project 제외)
    if (filters.modules.length > 0) {
      return nodes.filter(
        (node) => node.type === "module" || node.type === "feature"
      );
    }
    return nodes;
  }, [rows, filteredActiveBars, expandedNodes, filters.features, filters.modules, viewMode]);

  // 노드별 위치 계산
  const nodePositions = useMemo(
    () => calculateNodePositions(flatNodes, viewMode),
    [flatNodes, viewMode]
  );

  // 총 높이 계산
  const totalHeight = useMemo(() => {
    if (nodePositions.length === 0) return 0;
    const last = nodePositions[nodePositions.length - 1];
    return last.top + last.height;
  }, [nodePositions]);

  // 연속된 스냅샷 엔트리 연결 정보 계산
  const snapshotConnections = useMemo(() => {
    const connections: Array<{
      fromBar: DraftBarType;
      toBar: DraftBarType;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }> = [];

    // 스냅샷만 필터링
    const snapshots = filteredActiveBars.filter((b) => {
      const isSnapshot = (b as any).isSnapshot;
      const hasMetaKey = (b as any).metaKey;
      return isSnapshot && hasMetaKey;
    });

    if (snapshots.length === 0) return connections;

    // metaKey + authorId로 그룹화 (같은 사용자, 같은 meta만 연결)
    const groupedByMetaAndAuthor = new Map<string, DraftBarType[]>();
    snapshots.forEach((bar) => {
      const metaKey = (bar as any).metaKey;
      const authorId = (bar as any).authorId;
      const groupKey = `${metaKey}::${authorId || "unknown"}`;
      if (!groupedByMetaAndAuthor.has(groupKey)) {
        groupedByMetaAndAuthor.set(groupKey, []);
      }
      groupedByMetaAndAuthor.get(groupKey)!.push(bar);
    });

    // 각 그룹에서 연속된 엔트리 찾기
    groupedByMetaAndAuthor.forEach((group) => {
      if (group.length < 2) return;

      // 날짜순 정렬
      const sorted = group.sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // 각 바의 위치 정보 가져오기
        const currentNode = nodePositions.find(
          (pos) =>
            pos.node.type === "feature" && pos.node.row?.rowId === current.rowId
        );
        const nextNode = nodePositions.find(
          (pos) =>
            pos.node.type === "feature" && pos.node.row?.rowId === next.rowId
        );

        if (!currentNode || !nextNode) continue;

        // 바의 레인 정보 가져오기
        const currentRowBars = filteredActiveBars.filter(
          (b) => b.rowId === current.rowId
        );
        const nextRowBars = filteredActiveBars.filter(
          (b) => b.rowId === next.rowId
        );

        const currentBarsWithLane = assignLanesToBars(currentRowBars);
        const nextBarsWithLane = assignLanesToBars(nextRowBars);

        const currentLayout = currentBarsWithLane.find(
          (l) => l.clientUid === current.clientUid
        );
        const nextLayout = nextBarsWithLane.find(
          (l) => l.clientUid === next.clientUid
        );

        if (!currentLayout || !nextLayout) continue;

        // rangeStart를 자정으로 정규화
        const rangeStartMidnight = new Date(
          rangeStart.getFullYear(),
          rangeStart.getMonth(),
          rangeStart.getDate()
        );

        // 각 바의 X 위치 계산
        const currentStartDate = parseLocalDate(current.startDate);
        const nextStartDate = parseLocalDate(next.startDate);

        const currentStartOffset = Math.round(
          (currentStartDate.getTime() - rangeStartMidnight.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const nextStartOffset = Math.round(
          (nextStartDate.getTime() - rangeStartMidnight.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const currentEndDate = parseLocalDate(current.endDate);
        const currentEndOffset = Math.round(
          (currentEndDate.getTime() - rangeStartMidnight.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const currentLeft = currentStartOffset * DAY_WIDTH;
        const currentWidth =
          (currentEndOffset - currentStartOffset + 1) * DAY_WIDTH;
        const nextLeft = nextStartOffset * DAY_WIDTH;

        // 화살표 시작점: 현재 바의 오른쪽 끝 중앙
        const fromX = currentLeft + currentWidth;
        const fromY =
          currentNode.top + currentLayout.lane * LANE_HEIGHT + LANE_HEIGHT / 2;

        // 화살표 끝점: 다음 바의 왼쪽 시작 중앙
        const toX = nextLeft;
        const toY =
          nextNode.top + nextLayout.lane * LANE_HEIGHT + LANE_HEIGHT / 2;

        connections.push({
          fromBar: current,
          toBar: next,
          fromX,
          fromY,
          toX,
          toY,
        });
      }
    });

    return connections;
  }, [filteredActiveBars, nodePositions, rangeStart]);

  return {
    expandedNodes,
    filteredActiveBars,
    activeBarsSet,
    rows,
    days,
    months,
    totalWidth,
    flatNodes,
    nodePositions,
    totalHeight,
    snapshotConnections,
  };
}

