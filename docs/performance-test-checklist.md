# Timeline 성능 최적화 테스트 체크리스트

## 각 Phase 완료 후 실행할 테스트

### 1. 기본 기능 테스트 (회귀 테스트)
- [ ] 블록 클릭 및 선택 가능
- [ ] 블록 드래그 앤 드롭 가능
- [ ] 블록 리사이즈 가능
- [ ] 블록 컨텍스트 메뉴 작동
- [ ] Flag 생성/편집/삭제 가능
- [ ] 프로젝트/모듈 펼치기/접기 가능
- [ ] 스크롤 동기화 (트리 <-> 타임라인)
- [ ] 검색 및 필터 작동
- [ ] Undo/Redo 작동

### 2. 성능 테스트
- [ ] 마우스 휠 드래그 5초 → FPS 55+ 유지
- [ ] 빠른 스크롤 시 깜빡임 없음
- [ ] 블록 선택 반응 지연 없음 (<100ms)
- [ ] 페이지 로드 시간 변화 없음

### 3. 브라우저 호환성 테스트
- [ ] Chrome (최신)
- [ ] Safari (최신)
- [ ] Firefox (최신)

### 4. 데이터 규모별 테스트
- [ ] 100개 블록
- [ ] 300개 블록
- [ ] 500개 블록
- [ ] 1000개 블록 (스트레스 테스트)

## 테스트 실행 방법

### Before (최적화 전)
1. 모든 Feature Flag OFF
2. 성능 모니터링 ON
3. 5초간 마우스 휠 드래그
4. 결과 기록: `__logPerformance()`

### After (최적화 후)
1. 해당 Feature Flag ON
2. 페이지 새로고침
3. 5초간 마우스 휠 드래그  
4. 결과 비교

### 문제 발생 시
1. 즉시 Feature Flag OFF
2. 페이지 새로고침
3. 에러 메시지 및 재현 단계 기록
4. Chrome DevTools Console 스크린샷

## 성능 측정 명령어

```javascript
// 1. 성능 로깅 활성화
__toggleTimelineFlag('enablePerformanceLogging', true);

// 2. 페이지 새로고침 후 테스트 수행

// 3. 결과 확인
__logPerformance();

// 4. 통계 초기화 (다음 테스트 전)
__resetPerformance();
```

## RAF 스로틀링 테스트 시나리오

### 시나리오 1: 느린 드래그
1. 마우스 휠 클릭 후 천천히 드래그 (3초간)
2. 예상: 부드러운 스크롤, 끊김 없음
3. FPS: 55-60 유지

### 시나리오 2: 빠른 드래그
1. 마우스 휠 클릭 후 빠르게 드래그 (1초간)
2. 예상: 따라가면서 부드러움 유지
3. 스크롤 끝까지 도달

### 시나리오 3: 방향 전환
1. 드래그 중 반대 방향으로 즉시 전환
2. 예상: 지연 없이 반응
3. 이전 RAF 취소되고 새 방향 적용

### 시나리오 4: 대량 데이터
1. 500개 블록 로드
2. 마우스 휠 드래그
3. 예상: RAF OFF 대비 눈에 띄는 개선

## 가상화 테스트 시나리오

### 시나리오 1: 스크롤 성능
1. 1000개 블록 로드
2. 빠르게 스크롤
3. 예상: DOM 노드 수 100개 이하 유지

### 시나리오 2: 깜빡임 방지
1. 빠른 스크롤 수행
2. 예상: 블록이 사라지거나 깜빡이지 않음
3. Overscan이 정상 작동

### 시나리오 3: 스크롤 위치 유지
1. 중간 위치로 스크롤
2. 블록 선택/편집
3. 예상: 스크롤 위치 변화 없음

## 롤백 절차

### 긴급 롤백 (1분 이내)
```javascript
// 브라우저 콘솔에서 실행
__resetTimelineFlags();
location.reload();
```

### 단계별 롤백
```javascript
// RAF만 끄기
__toggleTimelineFlag('enableRAFThrottle', false);

// 가상화만 끄기
__toggleTimelineFlag('enableVirtualization', false);

// 메모이제이션만 끄기
__toggleTimelineFlag('enableAdvancedMemo', false);

// 페이지 새로고침
location.reload();
```

### 코드 롤백
```bash
# 백업 파일로 복원
mv src/components/plans/gantt-draft/timeline/useTimelineScroll.ts.backup \
   src/components/plans/gantt-draft/timeline/useTimelineScroll.ts

# 빌드 확인
yarn build
```

## 테스트 결과 기록 템플릿

```markdown
## 테스트 날짜: YYYY-MM-DD
## 테스트 환경
- 브라우저: Chrome 120
- 블록 개수: 300개
- 화면 크기: 1920x1080

## Before (최적화 전)
- 평균 FPS: ____ fps
- 최소 FPS: ____ fps
- 렌더링 시간: ____ ms
- DOM 노드 수: ____ 개

## After (최적화 후)
- 평균 FPS: ____ fps (+__%)
- 최소 FPS: ____ fps (+__%)
- 렌더링 시간: ____ ms (-__%)
- DOM 노드 수: ____ 개 (-__%)

## 회귀 테스트
- [ ] 모든 기본 기능 정상 작동
- [ ] 에러 없음
- [ ] 시각적 버그 없음

## 결론
- [ ] 성능 개선 확인
- [ ] 다음 단계 진행 가능
- [ ] 또는 롤백 필요
```

