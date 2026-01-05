# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.0] - 2026-01-XX

### Added
- **Personal Space 대시보드**: 데이터 중심 개인 분석 뷰
  - 스냅샷 작성 현황 (주차 수, 엔트리 총 개수, 이번 주/지난 주 작성 수)
  - 할당된 계획 현황 (전체, 활성)
  - 메뉴 사용 통계 (최근 7일/14일 방문 현황, Top 5 페이지)
  - 최근 작성한 스냅샷 엔트리 (최근 5개, 카드 형식)
  - 도메인/프로젝트 활동 분포 (Top 10, 그라디언트 바 차트)
  - 주차별 엔트리 수 추이 (최근 8주, 세로 바 차트)
  - 메뉴 사용 데이터 안내 문구 (PoC 성격 명시)
- **Alignment 간트 차트**: Plans와 Snapshot Entries 타임라인 시각화
  - `/plans/gantt`와 완전히 동일한 간트 차트 UI 제공
  - 사용자 개인 관점의 계획(Plans) vs 실제 작업(Snapshot Entries) 비교
  - Snapshot 항목 시각적 구분 (📸 이모지 + custom flag)
  - 주차를 실제 날짜 범위로 자동 변환 (ISO Week 기준)
  - 트리 구조, 레인 레이아웃, 타임라인 네비게이션 모두 지원
  - 필터를 제외한 모든 간트 차트 기능 활용 가능
  - 읽기 전용 모드 (편집 불가)
- **GNB 페이지 위계 표시**: 좌측 로고 하단에 브레드크럼 추가
  - 현재 페이지의 카테고리와 메뉴명 표시 (예: "Works / Plans")
  - 연한 색상으로 위계 강조
  - 모바일에서는 숨김 처리
- **데모 환경 확장**: 데모 모드 전면 개선
  - 데모 워크스페이스에 대한 완전한 기능 지원
  - 로그인 페이지에 데모 환경 안내 토스트 메시지 추가
  - Continue as Guest 버튼을 통한 즉시 접속 지원
  - 회원가입을 통한 새 계정 생성 및 데모 환경 둘러보기 가능
- **데모 데이터 생성**: 포괄적인 목업 데이터 제공
  - 2025년 12월 ~ 2026년 2월 기간의 스냅샷 엔트리 (120개)
  - 프로젝트, 모듈, 기능별 계획 데이터 (50개 이상)
  - 역할 기반 담당자 할당 (Planning, Design, FE, BE, QA)
  - 간트 차트 플래그 데이터 (스프린트, 릴리즈, 배포 등)
- **전체 통계 표시**: Admin 및 Team Feed 페이지 개선
  - Admin 대시보드에 전체 스냅샷/엔트리 통계 표시
  - Team Feed에 전체 스냅샷 엔트리 개수 표시 (필터 무관)

### Fixed
- **ISO Week 계산 일관성**: 전체 앱에서 일관된 ISO Week 계산 로직 적용
  - `menuStats.ts`의 수동 ISO Week 계산을 `getCurrentISOWeek()` 유틸리티로 통일
  - 타임존 고려 및 ISO 8601 표준 준수
- **N+1 쿼리 최적화**: Personal Dashboard의 주차별 추이 계산 성능 개선
  - 모든 엔트리를 한 번에 조회하여 클라이언트 사이드에서 집계
  - 쿼리 횟수: 8회 → 1회로 대폭 감소
- **데모 모드 데이터 호환성**: 프로덕션과 데모 환경 간 데이터 구조 차이 해결
  - `thisWeek.tasks` 및 `risks` 필드의 문자열/객체 타입 혼용 처리
  - `ScrumCard`, `FeedItem` 컴포넌트에 방어적 프로그래밍 적용
  - `snapshot_entries` 테이블의 `name` 컬럼을 `profiles.display_name`과 일치하도록 수정
- **워크스페이스 ID 하드코딩 제거**: 동적 워크스페이스 ID 사용
  - `getDefaultWorkspaceId()` 함수로 환경변수 기반 워크스페이스 선택
  - `NEXT_PUBLIC_APP_MODE`에 따라 자동으로 프로덕션/데모 워크스페이스 선택
- **간트 차트 스크롤 동기화**: 플래그 영역과 타임라인 스크롤 연동
  - 플래그 영역의 가로 스크롤이 타임라인과 동기화되도록 개선
- **계획 데이터 무결성**: `plan_assignees`가 없는 계획 데이터 정리
  - 역할 기반 담당자 할당 보장 (각 스테이지당 1명)

### Changed
- **기존 Alignment 재구현**: 카드 기반 레이아웃에서 간트 차트로 전환
  - 주차 선택기 제거 (전체 기간 타임라인으로 대체)
  - Plan Card + Snapshot Overlay 구조 제거
  - DraftGanttView 컴포넌트 100% 재사용 (코드 633줄 감소)
- **Personal Dashboard UI 개편**: 카드 형태에서 테이블/리스트 중심으로 변경
  - KPI 그리드: 3열 테이블 레이아웃
  - Usage Trend: 시각화 바 차트 추가
  - Top Routes: 순위 배지 (금, 은, 동) 추가
  - Recent Activity: 2열 테이블 구조

### Improved
- **Alignment SNB 배지**: 할당된 Plans 수 + 현재 주차 Snapshot Entries 수 표시
  - 실시간으로 사용자의 계획 및 작업 현황 확인 가능
  - `menuStats.ts`에서 자동 계산
- **데모 환경 사용성**: 데모 환경 접근성 및 안내 개선
  - 로그인 페이지 상단에 데모 환경 사용 안내 메시지 표시
  - 중앙 정렬 및 줄바꿈 적용으로 가독성 향상
- **데이터 일관성**: 데모 데이터의 구조적 일관성 확보
  - 모든 스냅샷 엔트리의 `name` 필드를 작성자 `display_name`으로 통일
  - 계획 데이터의 담당자 할당을 `basic_role` 기반으로 자동화

### Technical Details
- **Personal Dashboard**:
  - `src/lib/dashboard/getPersonalDashboardMetrics.ts`: 개인 메트릭 집계 함수
  - `src/components/weekly-scrum/my/DataOnlyDashboard.tsx`: 테이블/리스트 중심 UI
  - `src/app/(scrum)/my/page.tsx`: 서버 사이드 데이터 조회
- **Alignment Gantt**:
  - `src/lib/data/alignmentGanttData.ts`: Plans + Snapshots 통합 데이터 레이어 (268줄)
  - `src/app/(scrum)/my/alignment/_components/AlignmentGanttClient.tsx`: DraftGanttView 래핑 (61줄)
  - `src/app/(scrum)/my/alignment/page.tsx`: 서버 컴포넌트 재작성 (53줄)
  - 삭제: `AlignmentView`, `PlanCard`, `SnapshotOverlay`, `WeekSelector` 등 5개 컴포넌트
  - 삭제: `/api/alignment` API route, `alignmentData.ts` 데이터 레이어
- **GNB Breadcrumb**:
  - `src/components/weekly-scrum/common/Navigation.tsx`: `getBreadcrumbFromPath()` 함수 추가
  - `src/components/weekly-scrum/common/Header.tsx`: 브레드크럼 렌더링
- **Menu Stats**:
  - `src/lib/data/menuStats.ts`: `alignment_count` 계산 로직, ISO Week 일관성 확보
  - `src/lib/telemetry/menuEvents.ts`: `/my/alignment` 경로 등록 (이미 존재)
- **기타**:
  - `src/lib/supabase/mode.ts`: `getDefaultWorkspaceId()` 함수 추가
  - `src/app/(scrum)/admin/page.tsx`: 전체 통계 조회 로직 추가
  - `src/app/(scrum)/team-feed/page.tsx`: 전체 엔트리 개수 조회 추가
  - `src/components/weekly-scrum/cards/ScrumCard.tsx`: 타입 안전성 개선
  - `src/components/team-feed/FeedItem.tsx`: 방어적 데이터 처리 추가
  - `src/components/plans/gantt-draft/DraftTimeline.tsx`: 플래그 영역 스크롤 동기화 구현

---

## [2.7.2] - 2025-12-23

### Added
- **레인 컨텍스트 메뉴**: 레인 우클릭 시 컨텍스트 메뉴 추가
  - 레인 추가 (아래에): 현재 레인 아래에 새로운 레인 생성
  - 레인 삭제: 현재 레인 제거 (계획이 있으면 Airbnb 스타일 확인 모달 표시)
  - Airbnb 스타일 디자인 적용 (그라데이션 호버, 아이콘 배경, 2줄 레이블)
- **필터 영역 개선**: 프로젝트, 모듈, 기능을 하나의 리스트로 통합하여 표시
  - 검색 기능 추가 (디바운스 300ms 적용)
  - 검색 중 로딩 스피너 표시
  - Cmd+A, Ctrl+A 전체 선택 허용
  - 필터 팝오버 위치를 필터 버튼 바로 아래로 조정

### Fixed
- **레인 추가 로직**: 모든 bars의 preferredLane을 올바르게 설정
  - newLaneIndex 이상의 bars는 1 증가
  - newLaneIndex 미만의 bars는 현재 위치 고정
  - 확장된 레인의 모든 계획 블록이 정확히 함께 이동
- **레인 컨텍스트 메뉴**: 버튼 클릭 이벤트 전파 방지로 정상 동작 보장
- **CreatePlanModal**: 담당자 드롭다운을 Portal로 렌더링하여 모달 overflow 제약 해결
- **작업 종료**: 페이지 강제 새로고침으로 서버 최신 데이터 확실히 불러오기

### Changed
- 레인 추가 시 빈 bar 자동 생성 제거 (불필요한 미지정 블록 생성 방지)
- '레인 추가 (위에)' 옵션 제거 (아래에만 추가 가능)
- 레인 삭제 확인 모달을 Airbnb 스타일 커스텀 모달로 변경 (window.confirm 제거)

### Improved
- **레인 컨텍스트 메뉴 디자인**: Airbnb 스타일 적용
  - 둥근 모서리 (rounded-xl)
  - 아이콘 배경 원형 컨테이너
  - 그라데이션 호버 효과
  - 부드러운 그림자 효과
- **레인 삭제 확인 모달**: 빨간색 그라데이션 헤더, 계획 개수 강조 표시, 부드러운 애니메이션

---

## [2.7.1] - 2025-12-22

### Added
- 도움말 모달에 타임라인 휠 클릭 스크롤링 기능 설명 추가

### Improved
- DraftTreePanel과 DraftTimeline의 세로 스크롤 동기화
  - 좌측 트리 패널과 우측 타임라인이 항상 같은 행을 표시하도록 개선
  - 공통 scrollTop 상태 관리로 스크롤 이벤트 동기화
  - 무한 루프 방지를 위한 현재값 비교 로직 추가

### Changed
- DraftTreePanel의 스크롤바를 숨김 처리
  - 스크롤 기능은 유지하되 UI만 숨김
  - Chrome, Firefox, Edge 등 주요 브라우저 지원
  - `scrollbar-hide` 클래스를 globals.css에 추가

### Technical Details
- `scrollbar-hide` 유틸리티 클래스 추가 (Webkit, Firefox, IE/Edge 지원)
- DraftGanttView에서 scrollTop 상태 관리 및 onScroll 콜백 구현
- useEffect 기반 외부 scrollTop 동기화 로직 추가

---

## [Earlier Versions]

이전 버전의 변경 사항은 추후 추가될 예정입니다.

