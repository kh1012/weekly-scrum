/**
 * Timeline 가상화 Hook
 * 
 * 화면에 보이는 노드만 렌더링하여 성능을 개선합니다.
 * Feature Flag로 제어되며, OFF 시에는 모든 노드를 렌더링합니다.
 * 
 * @example
 * const { visibleStartIndex, visibleEndIndex, offsetY, totalHeight } = useVirtualization({
 *   nodePositions,
 *   containerHeight: 600,
 *   scrollTop: 1000,
 *   overscan: 5,
 * });
 */

import { useMemo } from 'react';
import { getFeatureFlags } from '../featureFlags';

export interface NodePosition {
  node: any;
  top: number;
  height: number;
}

export interface VirtualizationResult {
  /** 렌더링 시작 인덱스 */
  visibleStartIndex: number;
  /** 렌더링 종료 인덱스 */
  visibleEndIndex: number;
  /** 상단 여백 (스크롤 위치 유지용) */
  offsetY: number;
  /** 전체 컨텐츠 높이 */
  totalHeight: number;
  /** 가상화 활성화 여부 */
  isVirtualized: boolean;
}

export interface UseVirtualizationProps {
  /** 노드 위치 배열 */
  nodePositions: NodePosition[];
  /** 컨테이너 높이 */
  containerHeight: number;
  /** 현재 스크롤 위치 */
  scrollTop: number;
  /** 여유 렌더링 개수 (기본값: 5) */
  overscan?: number;
}

/**
 * 이진 검색으로 viewport 시작 위치에 해당하는 노드 인덱스 찾기
 * 
 * @param positions 노드 위치 배열
 * @param targetY 찾고자 하는 Y 위치
 * @returns 해당 위치의 노드 인덱스
 */
function binarySearchStart(
  positions: NodePosition[],
  targetY: number
): number {
  if (positions.length === 0) return 0;

  let left = 0;
  let right = positions.length - 1;
  let result = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const node = positions[mid];
    const nodeBottom = node.top + node.height;

    if (nodeBottom <= targetY) {
      // 노드가 viewport 위쪽에 있음 → 오른쪽 탐색
      left = mid + 1;
    } else if (node.top > targetY) {
      // 노드가 viewport 아래쪽에 있음 → 왼쪽 탐색
      right = mid - 1;
    } else {
      // 노드가 viewport 내에 있음
      result = mid;
      // 더 위쪽에 걸친 노드가 있을 수 있으므로 왼쪽 탐색 계속
      right = mid - 1;
    }
  }

  return result;
}

/**
 * 순차 검색으로 viewport 종료 위치에 해당하는 노드 인덱스 찾기
 * 
 * @param positions 노드 위치 배열
 * @param targetY 찾고자 하는 Y 위치
 * @param startIndex 시작 인덱스 (이진 검색 결과)
 * @returns 해당 위치의 노드 인덱스
 */
function findEndIndex(
  positions: NodePosition[],
  targetY: number,
  startIndex: number
): number {
  for (let i = startIndex; i < positions.length; i++) {
    const node = positions[i];
    if (node.top > targetY) {
      return Math.max(startIndex, i - 1);
    }
  }
  return positions.length - 1;
}

/**
 * 가상화 계산
 * 
 * @param nodePositions 노드 위치 배열
 * @param containerHeight 컨테이너 높이
 * @param scrollTop 스크롤 위치
 * @param overscan 여유 렌더링 개수
 * @returns 가상화 결과
 */
function calculateVirtualization(
  nodePositions: NodePosition[],
  containerHeight: number,
  scrollTop: number,
  overscan: number
): VirtualizationResult {
  const flags = getFeatureFlags();

  // Feature Flag가 OFF이거나 노드가 없으면 가상화 비활성화
  if (!flags.enableVirtualization || nodePositions.length === 0) {
    return {
      visibleStartIndex: 0,
      visibleEndIndex: nodePositions.length - 1,
      offsetY: 0,
      totalHeight: nodePositions.length > 0
        ? nodePositions[nodePositions.length - 1].top + nodePositions[nodePositions.length - 1].height
        : 0,
      isVirtualized: false,
    };
  }

  // 1. Viewport 범위 계산
  const viewportStart = scrollTop;
  const viewportEnd = scrollTop + containerHeight;

  // 2. 이진 검색으로 시작 인덱스 찾기
  const startIndex = binarySearchStart(nodePositions, viewportStart);

  // 3. 순차 검색으로 종료 인덱스 찾기
  const endIndex = findEndIndex(nodePositions, viewportEnd, startIndex);

  // 4. Overscan 적용
  const visibleStartIndex = Math.max(0, startIndex - overscan);
  const visibleEndIndex = Math.min(nodePositions.length - 1, endIndex + overscan);

  // 5. 상단 offset 계산 (스크롤 위치 유지)
  const offsetY = visibleStartIndex > 0 
    ? nodePositions[visibleStartIndex].top 
    : 0;

  // 6. 전체 높이 계산
  const lastNode = nodePositions[nodePositions.length - 1];
  const totalHeight = lastNode.top + lastNode.height;

  // 디버그 모드일 때 로깅
  if (flags.enableDebugMode) {
    console.log('[Virtualization]', {
      total: nodePositions.length,
      visible: visibleEndIndex - visibleStartIndex + 1,
      startIndex: visibleStartIndex,
      endIndex: visibleEndIndex,
      offsetY,
      totalHeight,
    });
  }

  return {
    visibleStartIndex,
    visibleEndIndex,
    offsetY,
    totalHeight,
    isVirtualized: true,
  };
}

/**
 * 가상화 Hook
 * 
 * 화면에 보이는 노드만 렌더링하도록 인덱스 범위를 계산합니다.
 */
export function useVirtualization({
  nodePositions,
  containerHeight,
  scrollTop,
  overscan = 5,
}: UseVirtualizationProps): VirtualizationResult {
  // useMemo로 계산 결과 캐싱
  const result = useMemo(
    () => calculateVirtualization(nodePositions, containerHeight, scrollTop, overscan),
    [nodePositions, containerHeight, scrollTop, overscan]
  );

  return result;
}

