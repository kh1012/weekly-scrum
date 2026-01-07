# 메모이제이션 전략 설계

## 목표

불필요한 컴포넌트 리렌더링과 계산을 제거하여 전반적인 성능을 개선합니다.

## 현재 상황 분석

### 1. 기존 메모이제이션
이미 프로젝트에는 다음과 같은 메모이제이션이 적용되어 있습니다:

- `useTimelineData.ts`: 여러 `useMemo`로 데이터 계산 캐싱
- `DraftBar.tsx`: `memo`로 컴포넌트 래핑
- 각종 Hook: `useCallback`으로 함수 메모이제이션

### 2. 개선 필요 영역
- **컴포넌트 리렌더링**: props 비교 최적화 필요
- **계산 비용**: 복잡한 계산의 캐싱 개선
- **참조 동일성**: 불필요한 객체/배열 재생성 방지

## 메모이제이션 전략

### Phase 1: 컴포넌트 메모이제이션 강화

#### 1.1. TimelineNode 컴포넌트들
현재 상태:
- `TimelineNodeSummary`: 메모이제이션 없음
- `TimelineNodeParent`: 메모이제이션 없음
- `TimelineNodeFeature`: 메모이제이션 없음

개선 방안:
```typescript
// React.memo + 커스텀 비교 함수
export const TimelineNodeFeature = memo(
  function TimelineNodeFeature(props) {
    // ... 구현
  },
  (prevProps, nextProps) => {
    // 필요한 props만 비교
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.top === nextProps.top &&
      prevProps.height === nextProps.height &&
      prevProps.selectedBarId === nextProps.selectedBarId &&
      prevProps.isEditing === nextProps.isEditing
      // ... 기타 중요한 props
    );
  }
);
```

#### 1.2. DraftBar 컴포넌트
현재 상태:
- 이미 `memo`로 래핑됨
- 하지만 커스텀 비교 함수 없음

개선 방안:
```typescript
export const DraftBar = memo(
  function DraftBar(props) {
    // ... 구현
  },
  (prevProps, nextProps) => {
    // bar 데이터 비교
    const barEqual = 
      prevProps.bar.clientUid === nextProps.bar.clientUid &&
      prevProps.bar.startDate === nextProps.bar.startDate &&
      prevProps.bar.endDate === nextProps.bar.endDate &&
      prevProps.bar.stage === nextProps.bar.stage;
    
    // 상태 비교
    const stateEqual =
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isEditing === nextProps.isEditing;
    
    return barEqual && stateEqual;
  }
);
```

### Phase 2: 계산 메모이제이션 개선

#### 2.1. nodePositions 계산
현재 상태:
```typescript
const nodePositions = useMemo(
  () => calculateNodePositions(flatNodes, viewMode),
  [flatNodes, viewMode]
);
```

개선 방안:
- `flatNodes`가 자주 변경되므로, 더 세밀한 의존성 관리 필요
- 노드 ID 배열로 비교하여 실제 변경 시에만 재계산

```typescript
const nodeIds = useMemo(
  () => flatNodes.map(n => n.id).join(','),
  [flatNodes]
);

const nodePositions = useMemo(
  () => calculateNodePositions(flatNodes, viewMode),
  [nodeIds, viewMode]
);
```

#### 2.2. 필터링 로직
현재 상태:
```typescript
const filteredActiveBars = useMemo(() => {
  return allBars.filter(/* 복잡한 필터 로직 */);
}, [allBars, filterIndex, filters.stages, filters.assignees]);
```

개선 방안:
- 필터 조건을 직렬화하여 비교
- 불필요한 재계산 방지

```typescript
const filterKey = useMemo(
  () => JSON.stringify({
    stages: filters.stages,
    assignees: filters.assignees,
    index: filterIndex,
  }),
  [filters.stages, filters.assignees, filterIndex]
);

const filteredActiveBars = useMemo(() => {
  return allBars.filter(/* ... */);
}, [allBars, filterKey]);
```

### Phase 3: 참조 동일성 유지

#### 3.1. 객체/배열 props
문제:
```typescript
// 매번 새로운 객체 생성
<Component filters={{ stages: [], assignees: [] }} />
```

해결:
```typescript
// useMemo로 참조 유지
const filters = useMemo(
  () => ({ stages: [], assignees: [] }),
  []
);

<Component filters={filters} />
```

#### 3.2. 콜백 함수
문제:
```typescript
// 매번 새로운 함수 생성
<Component onClick={() => handleClick(id)} />
```

해결:
```typescript
// useCallback으로 함수 메모이제이션
const handleClickMemo = useCallback(
  () => handleClick(id),
  [id, handleClick]
);

<Component onClick={handleClickMemo} />
```

## Feature Flag 통합

메모이제이션 최적화도 Feature Flag로 제어하여 안전하게 배포합니다.

```typescript
// featureFlags.ts에 이미 정의됨
enableAdvancedMemo: boolean;
```

사용 예시:
```typescript
const flags = getFeatureFlags();

export const TimelineNodeFeature = flags.enableAdvancedMemo
  ? memo(TimelineNodeFeatureImpl, customCompare)
  : TimelineNodeFeatureImpl;
```

## 성능 예측

### Before (메모이제이션 개선 전)
- **리렌더링 횟수**: 스크롤 시 100+ 컴포넌트 리렌더링
- **계산 시간**: 필터 변경 시 50-100ms
- **메모리 사용량**: 중간

### After (메모이제이션 개선 후)
- **리렌더링 횟수**: 스크롤 시 10-20 컴포넌트만 리렌더링 (-80-90%)
- **계산 시간**: 필터 변경 시 10-20ms (-70-80%)
- **메모리 사용량**: 약간 증가 (캐시 저장)

## 구현 우선순위

### 높음 (즉시 적용)
1. `TimelineNodeFeature` 메모이제이션
2. `DraftBar` 커스텀 비교 함수
3. `nodePositions` 계산 최적화

### 중간 (선택적 적용)
1. `TimelineNodeParent` 메모이제이션
2. `TimelineNodeSummary` 메모이제이션
3. 필터링 로직 최적화

### 낮음 (필요 시 적용)
1. 기타 작은 컴포넌트 메모이제이션
2. 세밀한 참조 동일성 관리

## 주의사항

### 1. 과도한 메모이제이션 방지
- 모든 컴포넌트를 메모이제이션할 필요 없음
- 작은 컴포넌트는 오히려 오버헤드 발생 가능

### 2. 비교 함수 복잡도
- 커스텀 비교 함수가 너무 복잡하면 오히려 느려질 수 있음
- 간단한 비교만 수행

### 3. 메모리 사용량
- 캐시 저장으로 메모리 사용량 증가
- 필요한 경우에만 메모이제이션 적용

## 테스트 방법

### 1. React DevTools Profiler
```markdown
1. Profiler 탭 열기
2. Record 시작
3. 스크롤/필터 변경 수행
4. Stop 후 Flamegraph 분석
5. 리렌더링 횟수 확인
```

### 2. 성능 측정
```javascript
// 브라우저 콘솔에서
__toggleTimelineFlag('enableAdvancedMemo', true);
__toggleTimelineFlag('enablePerformanceLogging', true);
location.reload();

// 테스트 수행 후
__logPerformance();
```

### 3. 메모리 프로파일링
```markdown
1. Chrome DevTools Memory 탭
2. Heap Snapshot 촬영
3. 메모이제이션 ON/OFF 비교
4. 메모리 증가량 확인
```

## 롤백 계획

### 문제 발생 시
```javascript
// Feature Flag OFF
__toggleTimelineFlag('enableAdvancedMemo', false);
location.reload();
```

### 코드 롤백
```bash
# 변경 파일 복원
git checkout src/components/plans/gantt-draft/timeline/components/
yarn build
```

## 다음 단계

메모이제이션 구현 완료 후:
1. ✅ 모든 테스트 시나리오 통과 확인
2. ✅ 성능 개선 측정 및 문서화
3. ✅ 최종 보고서 작성

---

**작성일**: 2025-01-07  
**작성자**: AI Assistant  
**버전**: 1.0

