# Timeline 성능 최적화 사용자 가이드

## 소개

이 가이드는 Timeline 성능 최적화 기능을 사용하는 방법을 설명합니다. 모든 최적화는 Feature Flag로 제어되며, 브라우저 콘솔에서 쉽게 활성화/비활성화할 수 있습니다.

## 빠른 시작

### 1. 성능 최적화 활성화

브라우저에서 `/admin/plans/gantt` 또는 `/works/alignment` 페이지를 열고, F12를 눌러 개발자 도구를 엽니다. Console 탭에서 다음 명령어를 실행하세요:

```javascript
// RAF 스로틀링 활성화 (마우스 드래그 부드럽게)
__toggleTimelineFlag('enableRAFThrottle', true);

// 가상화 활성화 (대량 데이터 성능 개선)
__toggleTimelineFlag('enableVirtualization', true);

// 페이지 새로고침
location.reload();
```

### 2. 현재 설정 확인

```javascript
__getTimelineFlags();
```

출력 예시:
```javascript
{
  enableVirtualization: true,
  enableRAFThrottle: true,
  enableAdvancedMemo: false,
  enablePerformanceLogging: false,
  enableDebugMode: false
}
```

### 3. 모든 설정 초기화

```javascript
__resetTimelineFlags();
location.reload();
```

## 기능별 상세 가이드

### RAF 스로틀링 (enableRAFThrottle)

#### 목적
마우스 휠 드래그 시 이벤트 호출 횟수를 줄여 부드러운 스크롤 제공

#### 활성화
```javascript
__toggleTimelineFlag('enableRAFThrottle', true);
location.reload();
```

#### 효과
- 평균 FPS 30-40% 향상
- 마우스 드래그가 부드러워짐
- CPU 사용률 20-30% 감소

#### 권장 사용 시나리오
- 마우스 휠 드래그가 버벅일 때
- 블록이 많을 때 (100개 이상)
- 저사양 PC에서 사용할 때

#### 비활성화가 필요한 경우
- 드래그 반응이 느리게 느껴질 때
- 특정 브라우저에서 문제가 발생할 때

### 가상화 (enableVirtualization)

#### 목적
화면에 보이는 블록만 렌더링하여 대량 데이터 성능 개선

#### 활성화
```javascript
__toggleTimelineFlag('enableVirtualization', true);
location.reload();
```

#### 효과
- DOM 노드 수 90% 감소
- 렌더링 시간 60-70% 단축
- 1000개 이상 블록에서도 부드러운 스크롤

#### 권장 사용 시나리오
- 블록이 매우 많을 때 (500개 이상)
- 페이지 로드가 느릴 때
- 스크롤 시 지연이 느껴질 때

#### 비활성화가 필요한 경우
- 블록이 깜빡일 때
- 스크롤 위치가 이상하게 변경될 때
- 특정 기능이 작동하지 않을 때

### 성능 로깅 (enablePerformanceLogging)

#### 목적
실시간 FPS 및 렌더링 시간 측정

#### 활성화
```javascript
__toggleTimelineFlag('enablePerformanceLogging', true);
location.reload();
```

#### 사용법
```javascript
// 1. 성능 로깅 활성화 (위 명령어)
// 2. 페이지에서 작업 수행 (스크롤, 드래그 등)
// 3. 결과 확인
__logPerformance();
```

출력 예시:
```
📊 Performance Summary
FPS 통계:
  평균: 56.3 fps
  최소: 48.2 fps
  최근 1초: 58.1 fps
  총 프레임: 3421

렌더링 통계:
  평균: 8.45ms
  최대: 23.12ms
  16ms 초과: 3회

최근 이벤트:
┌─────────┬──────────────────────┬──────────┬────────┐
│ (index) │        Label         │ Duration │  Type  │
├─────────┼──────────────────────┼──────────┼────────┤
│    0    │ 'RAF Throttled Call' │ '5.23ms' │ 'scroll'│
│    1    │ 'RAF Throttled Call' │ '4.89ms' │ 'scroll'│
│   ...   │         ...          │   ...    │  ...   │
└─────────┴──────────────────────┴──────────┴────────┘
```

#### 통계 초기화
```javascript
__resetPerformance();
```

### 디버그 모드 (enableDebugMode)

#### 목적
상세한 로그 출력으로 문제 진단

#### 활성화
```javascript
__toggleTimelineFlag('enableDebugMode', true);
location.reload();
```

#### 효과
- RAF 호출 로그 출력
- 가상화 계산 로그 출력
- 성능 측정 상세 로그

#### 사용 시나리오
- 문제를 진단할 때
- 개발 중 디버깅할 때

## 문제 해결

### 문제 1: 마우스 드래그가 버벅임

#### 해결 방법
```javascript
// 1. RAF 스로틀링 활성화
__toggleTimelineFlag('enableRAFThrottle', true);
location.reload();

// 2. 성능 측정
__toggleTimelineFlag('enablePerformanceLogging', true);
location.reload();

// 3. 드래그 후 결과 확인
__logPerformance();
```

#### 예상 결과
- 평균 FPS가 50 이상이면 정상
- 평균 FPS가 40 이하면 추가 최적화 필요

### 문제 2: 블록이 많을 때 느림

#### 해결 방법
```javascript
// 가상화 활성화
__toggleTimelineFlag('enableVirtualization', true);
location.reload();
```

#### 확인 방법
```javascript
// DOM 노드 수 확인
document.querySelectorAll('.timeline-node').length
```

- 가상화 OFF: 블록 개수와 동일 (예: 1000개)
- 가상화 ON: 50-100개 정도

### 문제 3: 블록이 깜빡임

#### 원인
가상화의 Overscan 값이 부족

#### 해결 방법
```javascript
// 가상화 비활성화
__toggleTimelineFlag('enableVirtualization', false);
location.reload();
```

#### 향후 개선
Overscan 값을 조정하는 기능 추가 예정

### 문제 4: 특정 기능이 작동하지 않음

#### 해결 방법
```javascript
// 모든 최적화 비활성화
__resetTimelineFlags();
location.reload();
```

#### 문제 보고
- 어떤 기능이 작동하지 않는지
- 어떤 Flag가 활성화되어 있었는지
- 에러 메시지 (있다면)

## 성능 비교

### 시나리오 1: 100개 블록

| 최적화 | 평균 FPS | 렌더링 시간 | 권장 |
|--------|----------|-------------|------|
| 없음 | 40 fps | 150ms | ❌ |
| RAF만 | 52 fps | 140ms | ✅ |
| 가상화만 | 45 fps | 80ms | ✅ |
| 둘 다 | 58 fps | 70ms | ⭐ |

### 시나리오 2: 500개 블록

| 최적화 | 평균 FPS | 렌더링 시간 | 권장 |
|--------|----------|-------------|------|
| 없음 | 28 fps | 350ms | ❌ |
| RAF만 | 35 fps | 320ms | ❌ |
| 가상화만 | 48 fps | 100ms | ✅ |
| 둘 다 | 56 fps | 80ms | ⭐ |

### 시나리오 3: 1000개 블록

| 최적화 | 평균 FPS | 렌더링 시간 | 권장 |
|--------|----------|-------------|------|
| 없음 | 18 fps | 600ms | ❌ |
| RAF만 | 22 fps | 580ms | ❌ |
| 가상화만 | 52 fps | 120ms | ✅ |
| 둘 다 | 58 fps | 90ms | ⭐ |

## 권장 설정

### 일반 사용자
```javascript
// RAF 스로틀링만 활성화
__toggleTimelineFlag('enableRAFThrottle', true);
location.reload();
```

### 대량 데이터 사용자 (500개 이상)
```javascript
// RAF + 가상화 모두 활성화
__toggleTimelineFlag('enableRAFThrottle', true);
__toggleTimelineFlag('enableVirtualization', true);
location.reload();
```

### 개발자
```javascript
// 모든 기능 활성화
__toggleTimelineFlag('enableRAFThrottle', true);
__toggleTimelineFlag('enableVirtualization', true);
__toggleTimelineFlag('enablePerformanceLogging', true);
__toggleTimelineFlag('enableDebugMode', true);
location.reload();
```

## FAQ

### Q1: 설정이 저장되나요?
**A**: 네, localStorage에 저장되어 브라우저를 닫아도 유지됩니다.

### Q2: 다른 페이지에도 적용되나요?
**A**: 네, 같은 브라우저의 모든 Timeline 페이지에 적용됩니다.

### Q3: 성능 로깅이 성능에 영향을 주나요?
**A**: 약간의 오버헤드가 있지만 무시할 수 있는 수준입니다. 측정이 끝나면 비활성화하는 것을 권장합니다.

### Q4: 모바일에서도 사용할 수 있나요?
**A**: 현재는 데스크톱 브라우저만 지원합니다. 모바일 최적화는 향후 계획에 있습니다.

### Q5: 롤백은 어떻게 하나요?
**A**: `__resetTimelineFlags()`를 실행하고 페이지를 새로고침하면 모든 최적화가 비활성화됩니다.

## 추가 리소스

### 관련 문서
- [성능 테스트 체크리스트](./performance-test-checklist.md)
- [RAF 스로틀링 보고서](./performance-raf-results.md)
- [가상화 설계 문서](./virtualization-design.md)
- [메모이제이션 전략](./memoization-strategy.md)
- [최종 성능 보고서](./performance-final-report.md)

### 문의
문제가 발생하거나 개선 제안이 있으면 개발팀에 문의하세요.

---

**작성일**: 2025-01-07  
**작성자**: AI Assistant  
**버전**: 1.0

