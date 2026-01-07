import { renderHook } from '@testing-library/react';
import { useVirtualization, type NodePosition } from '../useVirtualization';
import { setFeatureFlag, resetFeatureFlags } from '../../featureFlags';

describe('useVirtualization', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    resetFeatureFlags();
  });

  // 테스트용 노드 생성
  const createNodePositions = (count: number): NodePosition[] => {
    const nodes: NodePosition[] = [];
    let top = 0;
    for (let i = 0; i < count; i++) {
      const height = 40; // 고정 높이
      nodes.push({
        node: { id: `node-${i}`, name: `Node ${i}` },
        top,
        height,
      });
      top += height;
    }
    return nodes;
  };

  describe('Feature Flag OFF', () => {
    it('should return all nodes when virtualization is disabled', () => {
      setFeatureFlag('enableVirtualization', false);
      
      const nodePositions = createNodePositions(100);
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 0,
          overscan: 5,
        })
      );

      expect(result.current.isVirtualized).toBe(false);
      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.visibleEndIndex).toBe(99);
      expect(result.current.offsetY).toBe(0);
    });
  });

  describe('Feature Flag ON', () => {
    beforeEach(() => {
      setFeatureFlag('enableVirtualization', true);
    });

    it('should calculate visible range correctly', () => {
      const nodePositions = createNodePositions(100);
      // scrollTop = 400, containerHeight = 600
      // viewport: 400 ~ 1000
      // 노드 높이 40px이므로 노드 10 ~ 24가 보임
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 400,
          overscan: 0, // overscan 없이 테스트
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      expect(result.current.visibleStartIndex).toBe(10); // 400 / 40
      expect(result.current.visibleEndIndex).toBeLessThanOrEqual(25); // 1000 / 40
    });

    it('should apply overscan correctly', () => {
      const nodePositions = createNodePositions(100);
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 400,
          overscan: 5,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      // overscan 5를 적용하면 startIndex - 5, endIndex + 5
      expect(result.current.visibleStartIndex).toBeLessThanOrEqual(10);
      expect(result.current.visibleEndIndex).toBeGreaterThanOrEqual(20);
    });

    it('should handle scroll at the top', () => {
      const nodePositions = createNodePositions(100);
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 0,
          overscan: 5,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });

    it('should handle scroll at the bottom', () => {
      const nodePositions = createNodePositions(100);
      const totalHeight = 100 * 40; // 4000px
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: totalHeight - 600, // 맨 아래
          overscan: 5,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      expect(result.current.visibleEndIndex).toBe(99);
    });

    it('should calculate offsetY correctly', () => {
      const nodePositions = createNodePositions(100);
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 800,
          overscan: 0,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      // startIndex = 20 (800 / 40)
      // offsetY = 20 * 40 = 800
      expect(result.current.offsetY).toBe(nodePositions[result.current.visibleStartIndex].top);
    });

    it('should calculate totalHeight correctly', () => {
      const nodePositions = createNodePositions(100);
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 0,
          overscan: 5,
        })
      );

      expect(result.current.totalHeight).toBe(100 * 40); // 4000px
    });

    it('should handle empty nodePositions', () => {
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions: [],
          containerHeight: 600,
          scrollTop: 0,
          overscan: 5,
        })
      );

      expect(result.current.isVirtualized).toBe(false);
      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.visibleEndIndex).toBe(-1);
      expect(result.current.totalHeight).toBe(0);
    });

    it('should handle variable height nodes', () => {
      const nodePositions: NodePosition[] = [
        { node: { id: '1' }, top: 0, height: 50 },
        { node: { id: '2' }, top: 50, height: 100 },
        { node: { id: '3' }, top: 150, height: 30 },
        { node: { id: '4' }, top: 180, height: 80 },
        { node: { id: '5' }, top: 260, height: 40 },
      ];
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 200,
          scrollTop: 100,
          overscan: 0,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      // viewport: 100 ~ 300
      // 노드 2 (50~150), 노드 3 (150~180), 노드 4 (180~260), 노드 5 (260~300)
      expect(result.current.visibleStartIndex).toBeGreaterThanOrEqual(1);
      expect(result.current.visibleEndIndex).toBeLessThanOrEqual(4);
    });

    it('should update when scrollTop changes', () => {
      const nodePositions = createNodePositions(100);
      
      const { result, rerender } = renderHook(
        ({ scrollTop }) =>
          useVirtualization({
            nodePositions,
            containerHeight: 600,
            scrollTop,
            overscan: 0,
          }),
        { initialProps: { scrollTop: 0 } }
      );

      const initialStart = result.current.visibleStartIndex;
      
      // 스크롤 변경
      rerender({ scrollTop: 800 });
      
      const newStart = result.current.visibleStartIndex;
      
      expect(newStart).toBeGreaterThan(initialStart);
    });

    it('should clamp indices to valid range', () => {
      const nodePositions = createNodePositions(10); // 작은 리스트
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 0,
          overscan: 100, // 매우 큰 overscan
        })
      );

      expect(result.current.visibleStartIndex).toBe(0);
      expect(result.current.visibleEndIndex).toBe(9);
    });
  });

  describe('Binary Search', () => {
    it('should find correct start index with binary search', () => {
      setFeatureFlag('enableVirtualization', true);
      
      const nodePositions = createNodePositions(1000); // 큰 리스트
      
      const { result } = renderHook(() =>
        useVirtualization({
          nodePositions,
          containerHeight: 600,
          scrollTop: 5000,
          overscan: 0,
        })
      );

      expect(result.current.isVirtualized).toBe(true);
      // scrollTop 5000, 노드 높이 40
      // startIndex = 125 (5000 / 40)
      expect(result.current.visibleStartIndex).toBe(125);
    });
  });
});

