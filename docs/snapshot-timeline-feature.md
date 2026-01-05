# Snapshot Timeline Feature (Personal Dashboard)

## 개요

Personal Space 대시보드에 **스냅샷 엔트리 타임라인** 기능을 추가했습니다. 이 기능은 Plans Gantt 스타일을 참고하여 구현되었으며, **읽기 전용(read-only)** 시각화를 제공합니다.

## 주요 기능

### 1. Gantt-like 타임라인 (데스크톱)

- **좌측**: Meta 그룹 목록 (domain/project/module/feature)
  - Sticky 컬럼으로 스크롤 시에도 고정
  - 각 그룹의 총 엔트리 수 표시
  
- **우측**: 주차별 블록 (horizontal scroll)
  - 각 주차(W01, W02, ...)별로 열 구성
  - 엔트리가 있는 주차에만 블록 표시
  - 블록 색상: 리스크 레벨에 따라 구분
    - 초록: 리스크 없음
    - 노랑: 경미 (level 1)
    - 주황: 중간 (level 2)
    - 빨강: 심각 (level 3)

### 2. 연속성 화살표

- 같은 Meta 그룹의 주차 간 연결을 화살표로 표시
- **Normal 화살표**: 연속된 주차 (실선)
- **Gap 화살표**: 주차 간격이 있는 경우 (점선 + 간격 표시)

### 3. 반응형 디자인

- **데스크톱 (≥768px)**: Gantt 타임라인
- **모바일 (<768px)**: 간소화된 리스트 뷰
  - Meta 그룹별 아코디언
  - 주차별 엔트리 목록

### 4. 읽기 전용

- 드래그/수정/삭제 불가
- 블록 클릭 시 선택 상태만 변경
- Plans Gantt의 편집 기능은 모두 제거

## 구현 구조

### 데이터 레이어

```
src/lib/data/
├── mySnapshotTimeline.ts          # 스냅샷 엔트리 조회 (read-only)
└── snapshotTimelineUtils.ts       # 그룹핑 및 화살표 계산
```

#### 주요 함수

- `getMySnapshotEntries()`: 주어진 기간의 내 스냅샷 엔트리 조회
- `buildWeekAxis()`: 주차 축 생성
- `groupEntriesByMeta()`: Meta별 그룹핑 (최근 활동순)
- `computeAllArrows()`: 연속성 화살표 계산

### UI 컴포넌트

```
src/components/weekly-scrum/my/
├── MySnapshotTimeline.tsx         # 타임라인 UI (클라이언트)
├── MySnapshotTimelineSection.tsx  # 서버 컴포넌트 래퍼
└── PersonalDashboard.tsx          # 대시보드 메인 (클라이언트)
```

#### 컴포넌트 역할

- **MySnapshotTimelineSection** (서버 컴포넌트)
  - 데이터 fetching
  - Suspense 경계 설정
  - 로딩 스피너 표시

- **MySnapshotTimeline** (클라이언트 컴포넌트)
  - Gantt 타임라인 렌더링
  - SVG 화살표 오버레이
  - 모바일 리스트 뷰
  - 반응형 전환

- **PersonalDashboard** (클라이언트 컴포넌트)
  - 타임라인 섹션을 children으로 받음
  - 서버/클라이언트 컴포넌트 분리

### 페이지 통합

```typescript
// src/app/(scrum)/my/page.tsx
const timelineSection = user?.id ? (
  <MySnapshotTimelineSection
    workspaceId={DEFAULT_WORKSPACE_ID}
    userId={user.id}
    weeksRange={12}
  />
) : null;

return (
  <PersonalDashboard
    // ... other props
    timelineSection={timelineSection}
  />
);
```

## 설정

### 주차 범위

기본값: **12주** (현재 주 기준 과거 12주)

변경 방법:
```typescript
<MySnapshotTimelineSection
  workspaceId={workspaceId}
  userId={userId}
  weeksRange={16} // 8, 12, 16 중 선택
/>
```

### 레이아웃 상수

```typescript
const WEEK_WIDTH = 120;          // 주차 열 너비
const ROW_HEIGHT = 60;           // 행 높이
const HEADER_HEIGHT = 64;        // 헤더 높이
const LEFT_COLUMN_WIDTH = 320;   // 좌측 메타 열 너비
```

## 데이터베이스 스키마

### 필요한 테이블

- `snapshots`: 스냅샷 메타데이터
  - `id`, `workspace_id`, `author_id`
  - `year`, `week`, `week_start_date`, `week_end_date`

- `snapshot_entries`: 스냅샷 엔트리
  - `id`, `snapshot_id`
  - `domain`, `project`, `module`, `feature`
  - `name` (작성자명)
  - `past_week` (JSONB)
  - `this_week` (JSONB)
  - `created_at`

### 쿼리 최적화

- 인덱스: `(workspace_id, author_id, year, week)`
- 범위 조회 시 연도/주차 필터링
- 엔트리는 스냅샷 ID로 조인

## 성능 고려사항

1. **서버 사이드 렌더링**
   - 초기 데이터는 서버에서 fetch
   - Suspense로 로딩 상태 처리

2. **메모이제이션**
   - `useMemo`로 주차 축, 그룹, 화살표 계산 캐싱
   - 데이터 변경 시에만 재계산

3. **반응형 전환**
   - 모바일에서는 간소화된 리스트 뷰
   - 불필요한 SVG 렌더링 제거

## 향후 개선 사항

- [ ] 블록 클릭 시 상세 정보 팝오버
- [ ] 주차 범위 선택 UI (8/12/16주)
- [ ] 필터링 (domain/project/module)
- [ ] 엔트리 검색
- [ ] PDF/이미지 내보내기

## 커밋 히스토리

1. `feat(dashboard): prepare full-width snapshot timeline section container`
2. `feat(snapshots): add read-only query for my snapshot entries (range-based)`
3. `feat(dashboard): group snapshot entries by meta and compute week links`
4. `feat(dashboard): render snapshot timeline table (gantt-like, read-only)`
5. `feat(dashboard): responsive snapshot timeline + empty/loading states`
6. `fix(dashboard): separate server/client components for snapshot timeline`

## 참고 자료

- Plans Gantt 구현: `src/components/plans/gantt-draft/`
- ISO 주차 계산: `src/lib/date/isoWeek.ts`
- Supabase 클라이언트: `src/lib/supabase/server.ts`

