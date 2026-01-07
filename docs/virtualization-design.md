# 가상화 알고리즘 설계

## 목표

화면에 보이는 노드만 렌더링하여 DOM 노드 수를 감소시키고, 대량의 블록 데이터에서도 부드러운 스크롤 경험을 제공합니다.

## 핵심 개념

### 1. Viewport 계산

```
containerScrollTop = 1000px
containerHeight = 600px
→ 보이는 영역: 1000px ~ 1600px
```

화면에 실제로 보이는 영역만 계산하여 해당 영역의 노드만 렌더링합니다.

### 2. Overscan (여유 렌더링)

```
startIndex - 5 ~ endIndex + 5
→ 빠른 스크롤 시 깜빡임 방지
```

실제 보이는 영역보다 위아래로 여유 노드를 더 렌더링하여 빠른 스크롤 시에도 깜빡임이 없도록 합니다.

### 3. 이진 검색

```
nodePositions 배열을 이진 검색하여 startIndex 빠르게 찾기
O(n) → O(log n) 개선
```

노드 위치 배열을 이진 검색하여 viewport에 해당하는 시작 인덱스를 빠르게 찾습니다.

## 구현 단계

### Phase 1: 기본 가상화 Hook 구현

#### 1.1. useVirtualization Hook
- **입력**:
  - `nodePositions`: 각 노드의 Y 위치 및 높이 정보
  - `containerHeight`: 컨테이너의 높이
  - `scrollTop`: 현재 스크롤 위치
  - `overscan`: 여유 렌더링 개수 (기본값: 5)

- **출력**:
  - `visibleStartIndex`: 렌더링 시작 인덱스
  - `visibleEndIndex`: 렌더링 종료 인덱스
  - `offsetY`: 상단 여백 (스크롤 위치 유지용)
  - `totalHeight`: 전체 컨텐츠 높이

#### 1.2. 알고리즘 상세

```typescript
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
```

### Phase 2: TimelineNodes 가상화 적용

#### 2.1. TimelineNodesVirtualized 컴포넌트
- 기존 `TimelineNodes` 컴포넌트를 래핑
- `useVirtualization` Hook 사용
- 보이는 노드만 렌더링

#### 2.2. 구조

```typescript
<div style={{ height: totalHeight, position: 'relative' }}>
  <div style={{ transform: `translateY(${offsetY}px)` }}>
    {visibleNodes.map((node) => (
      <TimelineNode key={node.id} {...node} />
    ))}
  </div>
</div>
```

### Phase 3: DraftTimeline 통합

#### 3.1. Feature Flag 제어
- `enableVirtualization` flag로 가상화 활성화/비활성화
- Flag OFF 시 기존 `TimelineNodes` 사용
- Flag ON 시 `TimelineNodesVirtualized` 사용

#### 3.2. 조건부 렌더링

```typescript
{flags.enableVirtualization ? (
  <TimelineNodesVirtualized
    nodePositions={nodePositions}
    scrollTop={scrollTop}
    containerHeight={containerHeight}
    {...otherProps}
  />
) : (
  <TimelineNodes
    nodePositions={nodePositions}
    {...otherProps}
  />
)}
```

## 성능 예측

### Before (가상화 전)
- **DOM 노드 수**: 1000개 (블록 개수와 동일)
- **렌더링 시간**: 200-300ms
- **스크롤 FPS**: 40-50 fps
- **메모리 사용량**: 높음

### After (가상화 후)
- **DOM 노드 수**: 50-100개 (화면에 보이는 것만)
- **렌더링 시간**: 50-100ms (-60-70%)
- **스크롤 FPS**: 55-60 fps (+20-30%)
- **메모리 사용량**: 중간 (-30-40%)

## 엣지 케이스 처리

### 1. 빠른 스크롤
- **문제**: 스크롤 속도가 너무 빠르면 노드가 깜빡임
- **해결**: Overscan 값을 증가 (5 → 10)
- **트레이드오프**: DOM 노드 수 약간 증가

### 2. 가변 높이 노드
- **문제**: 노드 높이가 동적으로 변경될 수 있음
- **해결**: `nodePositions`를 `useMemo`로 계산하여 높이 변경 시 재계산
- **주의**: 높이 변경 시 스크롤 위치 보정 필요

### 3. 스크롤 위치 점프
- **문제**: 가상화로 인해 스크롤 위치가 갑자기 변경될 수 있음
- **해결**: `offsetY`를 정확히 계산하여 스크롤 위치 유지
- **검증**: 스크롤 전후 선택된 노드의 화면 위치가 동일해야 함

### 4. 초기 로드
- **문제**: 초기 로드 시 스크롤 위치가 0이 아닐 수 있음
- **해결**: `scrollTop` prop을 받아서 초기 viewport 계산
- **예**: URL에서 특정 노드로 스크롤하는 경우

## 테스트 시나리오

### 시나리오 1: 기본 스크롤
```markdown
1. 100개 블록 로드
2. 천천히 스크롤 (위→아래)
3. 예상: DOM 노드 수 50개 이하 유지
4. 예상: 깜빡임 없음
```

### 시나리오 2: 빠른 스크롤
```markdown
1. 500개 블록 로드
2. 빠르게 스크롤 (끝까지)
3. 예상: 깜빡임 없음 (Overscan 덕분)
4. 예상: FPS 55+ 유지
```

### 시나리오 3: 스크롤 위치 유지
```markdown
1. 중간 위치로 스크롤
2. 블록 선택/편집
3. 예상: 스크롤 위치 변화 없음
4. 예상: 선택된 블록이 화면에서 사라지지 않음
```

### 시나리오 4: 대량 데이터
```markdown
1. 1000개 블록 로드
2. 스크롤 테스트
3. 예상: DOM 노드 수 100개 이하
4. 예상: 페이지 로드 시간 변화 없음
```

### 시나리오 5: Feature Flag 토글
```markdown
1. 가상화 ON → 정상 작동 확인
2. 가상화 OFF → 기존 방식으로 복귀
3. 예상: 기능 차이 없음
4. 예상: 에러 없음
```

## 구현 파일 목록

### 새로 생성할 파일
1. `src/components/plans/gantt-draft/timeline/useVirtualization.ts`
   - 가상화 Hook 구현

2. `src/components/plans/gantt-draft/timeline/components/TimelineNodesVirtualized.tsx`
   - 가상화된 노드 렌더링 컴포넌트

3. `src/components/plans/gantt-draft/timeline/__tests__/useVirtualization.test.ts`
   - 가상화 Hook 단위 테스트

### 수정할 파일
1. `src/components/plans/gantt-draft/DraftTimeline.tsx`
   - 가상화 컴포넌트 조건부 렌더링
   - `containerHeight` state 추가 (ResizeObserver 사용)

2. `src/components/plans/gantt-draft/featureFlags.ts`
   - 이미 `enableVirtualization` flag 존재 (수정 불필요)

## 이진 검색 알고리즘

```typescript
/**
 * 이진 검색으로 viewport 시작 위치에 해당하는 노드 인덱스 찾기
 * 
 * @param positions 노드 위치 배열 (top, height)
 * @param targetY 찾고자 하는 Y 위치
 * @returns 해당 위치의 노드 인덱스
 */
function binarySearchStart(
  positions: Array<{ top: number; height: number }>,
  targetY: number
): number {
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
  positions: Array<{ top: number; height: number }>,
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
```

## 최적화 포인트

### 1. useMemo 사용
```typescript
// nodePositions 계산 결과 캐싱
const nodePositions = useMemo(
  () => calculateNodePositions(flatNodes, viewMode),
  [flatNodes, viewMode]
);

// 가상화 결과 캐싱
const virtualResult = useMemo(
  () => calculateVirtualization(nodePositions, scrollTop, containerHeight),
  [nodePositions, scrollTop, containerHeight]
);
```

### 2. RAF 스로틀링과 결합
```typescript
// 스크롤 이벤트를 RAF로 스로틀링
const handleScroll = useRAFThrottle(() => {
  setScrollTop(containerRef.current?.scrollTop ?? 0);
});
```

### 3. ResizeObserver 사용
```typescript
// 컨테이너 높이 변경 감지
useEffect(() => {
  if (!containerRef.current) return;
  
  const observer = new ResizeObserver((entries) => {
    const height = entries[0].contentRect.height;
    setContainerHeight(height);
  });
  
  observer.observe(containerRef.current);
  
  return () => observer.disconnect();
}, []);
```

## 성능 측정 방법

### 1. DOM 노드 수 측정
```javascript
// 브라우저 콘솔에서 실행
document.querySelectorAll('.timeline-node').length
```

### 2. 렌더링 시간 측정
```javascript
// performanceMonitor 사용
__toggleTimelineFlag('enablePerformanceLogging', true);
__logPerformance();
```

### 3. FPS 측정
```javascript
// Chrome DevTools Performance 탭에서 측정
// 또는 performanceMonitor 사용
__logPerformance();
```

## 롤백 계획

### 문제 발생 시
1. **즉시 Feature Flag OFF**
   ```javascript
   __toggleTimelineFlag('enableVirtualization', false);
   location.reload();
   ```

2. **코드 롤백**
   ```bash
   git checkout src/components/plans/gantt-draft/DraftTimeline.tsx
   yarn build
   ```

3. **가상화 파일 삭제**
   ```bash
   rm src/components/plans/gantt-draft/timeline/useVirtualization.ts
   rm src/components/plans/gantt-draft/timeline/components/TimelineNodesVirtualized.tsx
   yarn build
   ```

## 다음 단계

가상화 구현 완료 후:
1. ✅ 모든 테스트 시나리오 통과 확인
2. ✅ 성능 개선 측정 및 문서화
3. ✅ 다음 Phase (메모이제이션) 진행

---

**작성일**: 2025-01-07  
**작성자**: AI Assistant  
**버전**: 1.0

