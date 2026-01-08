/**
 * NodePosition 인덱싱 Hook
 * 
 * NodePosition을 rowId로 빠르게 조회할 수 있는 Map 생성
 * O(n) 탐색을 O(1)로 개선하여 SnapshotConnections 계산 최적화
 * 
 * Feature Flag로 제어되며, enableAdvancedMemo가 OFF면 null 반환
 */

import { useMemo } from 'react';
import type { NodePosition } from './useVirtualization';

/**
 * NodePosition Map 인덱스 생성
 * 
 * @param nodePositions 노드 위치 배열
 * @param enableAdvancedMemo 고급 메모이제이션 활성화 여부
 * @returns rowId로 NodePosition을 빠르게 조회할 수 있는 Map (비활성화 시 null)
 */
export function useNodePositionIndex(
  nodePositions: NodePosition[],
  enableAdvancedMemo: boolean
): Map<string, NodePosition> | null {
  return useMemo(() => {
    if (!enableAdvancedMemo) return null;
    
    const map = new Map<string, NodePosition>();
    
    for (const pos of nodePositions) {
      // feature 타입 노드만 인덱싱 (snapshot connections에서 사용)
      if (pos.node.type === "feature" && pos.node.row?.rowId) {
        map.set(pos.node.row.rowId, pos);
      }
    }
    
    return map;
  }, [nodePositions, enableAdvancedMemo]);
}

