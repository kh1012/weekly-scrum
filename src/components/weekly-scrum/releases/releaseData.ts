import type { Release } from "./types";

export const RELEASES: Release[] = [
  {
    version: "2.6.0",
    date: "2025-12-16",
    title: "스냅샷 관리 UX 대폭 개선 & CollaboratorEditor 업그레이드",
    summary:
      "스냅샷 관리 페이지의 레이아웃과 높이 계산을 최적화하고, 협업자 편집기에 커스텀 드롭다운과 다중 추가 기능을 도입했습니다.",
    changes: [
      {
        type: "feat",
        description: "CollaboratorEditor 커스텀 드롭다운 UI - 이미 추가된 협업자 자동 제외",
      },
      {
        type: "feat",
        description: "CollaboratorEditor 여러 명 동시 추가 기능 - 체크박스로 다중 선택 후 일괄 추가",
      },
      {
        type: "feat",
        description: "TaskEditor/RiskEditor 단축키(⌥+⌘+↓) 추가 시 새 필드로 자동 포커스",
      },
      {
        type: "feat",
        description: "RiskEditor에도 ⌥+⌘+↓ 단축키로 새 리스크 추가",
      },
      {
        type: "feat",
        description: "NewSnapshotModal - 현재 주차 데이터 존재 시 안내 화면 표시",
      },
      {
        type: "feat",
        description: "PlainTextPreview에 작성자 이름(name) 표시 추가",
      },
      {
        type: "improve",
        description: "스냅샷 관리/편집/신규 페이지 높이 계산 최적화 (Header 높이에 맞춤)",
      },
      {
        type: "improve",
        description: "SnapshotsMainView localStorage 상태 복원 타이밍 수정 - 주차/데이터 불일치 해결",
      },
      {
        type: "improve",
        description: "NewSnapshotModal에서 스냅샷 관리 이동 시 현재 주차 자동 선택",
      },
      {
        type: "improve",
        description: "PlainTextPreview 콘텐츠 영역 그라데이션 배경 적용",
      },
      {
        type: "improve",
        description: "대시보드 로딩 스피너를 LogoLoadingSpinner로 변경",
      },
      {
        type: "fix",
        description: "로그인 페이지에 PKCE 인증 오류 메시지 표시 추가",
      },
      {
        type: "fix",
        description: "LoadingEntryCard undefined 배열 접근 오류 수정",
      },
      {
        type: "fix",
        description: "SnapshotEditForm 헤더 높이 PlainTextPreview와 통일 (h-12)",
      },
      {
        type: "style",
        description: "MainContent/EditSnapshotsView 불필요한 border/shadow 제거",
      },
    ],
  },
  {
    version: "2.5.0",
    date: "2025-12-15",
    title: "개인 대시보드 개선 & 스냅샷 관리 UX 최적화",
    summary:
      "개인 대시보드에 지난 주 대비 추세 분석 기능을 추가하고, 스냅샷 관리 페이지의 UI/UX를 전반적으로 개선했습니다.",
    changes: [
      {
        type: "feat",
        description: "대시보드 추세 분석 - 지난 주 대비 스냅샷/엔트리/진척률/프로젝트/모듈/기능/협업자 변화량 표시",
      },
      {
        type: "feat",
        description: "대시보드 통계 확장 - 스냅샷 엔트리, 진행 중 모듈, 진행 중 기능 카드 추가",
      },
      {
        type: "feat",
        description: "WeekMetaPanel 인라인 확장 방식으로 변경 (backdrop 제거)",
      },
      {
        type: "feat",
        description: "YearlyHeatmap 10단계 색상 스케일 적용 (스냅샷 엔트리 기준)",
      },
      {
        type: "improve",
        description: "SNB 아이콘을 Font Awesome SVG 아이콘으로 교체",
      },
      {
        type: "improve",
        description: "대시보드/스냅샷 관리 페이지 Airbnb 스타일 적용",
      },
      {
        type: "improve",
        description: "WeekSelector z-index 조정으로 드롭다운 겹침 문제 해결",
      },
      {
        type: "style",
        description: "대시보드 하단 안내 문구 개선 - 스냅샷 기록 권장 메시지",
      },
      {
        type: "style",
        description: "대시보드 7열 반응형 통계 그리드 레이아웃",
      },
      {
        type: "fix",
        description: "스냅샷 수 불일치 문제 해결 (snapshots 테이블 기준으로 통일)",
      },
      {
        type: "fix",
        description: "전체 펼치기 버튼 높이를 뷰 모드 토글과 일치하도록 조정",
      },
    ],
  },
  {
    version: "2.4.1",
    date: "2025-12-15",
    title: "Manage 편집 UX 개선 & 히트맵 반응형 레이아웃",
    summary:
      "스냅샷 편집 폼의 UX를 전반적으로 개선하고, 연간 히트맵에 반응형 분기별 그리드 레이아웃을 적용했습니다.",
    changes: [
      {
        type: "feat",
        description: "YearlyHeatmap 반응형 분기별 그리드 (lg:4열, md:2열, xs:1열)",
      },
      {
        type: "feat",
        description: "CollaboratorEditor 단일/멀티 선택 모드 토글",
      },
      {
        type: "feat",
        description: "This Week에서 가져오기 - 복사가 아닌 이동으로 변경",
      },
      {
        type: "improve",
        description: "RiskEditor UI를 TaskEditor와 동일한 스타일로 통일",
      },
      {
        type: "improve",
        description: "CollaboratorEditor 관계 아이콘 직관적 화살표로 변경",
      },
      {
        type: "improve",
        description: "SnapshotEditForm 전체 너비 사용 (max-width 제한 제거)",
      },
      {
        type: "improve",
        description: "ManageEditorScreen 미리보기 꺼진 상태에서도 리사이즈 가능",
      },
      {
        type: "style",
        description: "멤버별 히트맵 카드 레이아웃 (이름+건수 좌측, 히트맵 우측)",
      },
      {
        type: "style",
        description: "팀/멤버 헤더 아이콘 SVG로 변경 (흰색 강조)",
      },
      {
        type: "fix",
        description: "RiskEditor 리스크 추가 시 risk와 riskLevel 동시 업데이트",
      },
      {
        type: "fix",
        description: "SnapshotCardList 헤더 1줄 + ... 옵션 메뉴 통합",
      },
    ],
  },
  {
    version: "2.4.0",
    date: "2025-12-11",
    title: "Calendar View & ISO 주차 기반 전면 개편",
    summary:
      "ISO 주차 기반으로 데이터 스키마를 전면 개편하고, 연간 캘린더/히트맵 뷰를 추가했습니다. 프로젝트/모듈/기능/멤버 4가지 필터로 Tasks 기준 집계를 확인할 수 있습니다.",
    changes: [
      {
        type: "feat",
        description: "ISO 주차 기준 데이터 스키마 전면 마이그레이션 (v3)",
      },
      {
        type: "feat",
        description: "연간 캘린더 뷰 - 전체 기간 + 월별 필터 드롭다운",
      },
      {
        type: "feat",
        description: "4개 필터 탭 - 프로젝트/모듈/기능/멤버별 Tasks 집계",
      },
      {
        type: "feat",
        description: "Calendar View 페이지 추가 (/calendar)",
      },
      {
        type: "feat",
        description:
          "캘린더/히트맵 슬라이딩 토글 분리 (자연스러운 translate 애니메이션)",
      },
      {
        type: "feat",
        description: "GitHub 잔디 스타일 히트맵 - 개인별 상대기여지수 시각화",
      },
      {
        type: "feat",
        description: "팀 전체 기여도 잔디 추가 (주간 집중도 한눈에 파악)",
      },
      {
        type: "feat",
        description: "WeekCell 더보기 클릭 시 확장/접기 토글 기능",
      },
      {
        type: "feat",
        description: "Pinterest Masonry 레이아웃 - Calendar Grid & Snapshots",
      },
      {
        type: "feat",
        description: "ScrumCard Task별 프로그래스 바 추가",
      },
      {
        type: "feat",
        description: "주 단위 막대 그래프로 상위 4개 프로젝트/멤버 표시",
      },
      {
        type: "feat",
        description: "기간 요약 패널 - 참여 프로젝트/멤버/모듈/피처 통계",
      },
      {
        type: "feat",
        description: "GNB 검색/필터와 연동 - 필터링된 데이터로 캘린더 표시",
      },
      {
        type: "feat",
        description: "GNB WeekSelector에 ISO 주차 날짜 범위 표시",
      },
      {
        type: "improve",
        description: "SnapshotToolbar 선택 버튼 높이 통일",
      },
      {
        type: "improve",
        description: "SNB에 Calendar 메뉴 추가 (v2 카테고리)",
      },
      {
        type: "style",
        description:
          "ScrumCard Airbnb 스타일 전면 개선 (상단 도메인 바, 라운드 카드)",
      },
      {
        type: "style",
        description: "전체 Airbnb 스타일 UI/UX 적용",
      },
      {
        type: "fix",
        description: "스냅샷 데이터 range 필드 파싱 오류 수정 (YYYY-MM-DD ~ 형식)",
      },
    ],
  },
  {
    version: "2.3.0",
    date: "2025-12-10",
    title: "스냅샷 관리 시스템 기능 추가",
    summary:
      "스냅샷 관리 페이지를 추가하고 v2 스키마 가이드/검증 문서를 정립했습니다.",
    changes: [
      {
        type: "feat",
        description:
          "스냅샷 관리 페이지 추가 - 데이터 로드/신규 생성/편집 기능",
      },
      {
        type: "feat",
        description: "v2 스키마 가이드 문서 (snapshot-guide-v2.md) 작성",
      },
      {
        type: "feat",
        description:
          "v2 스키마 검증 가이드 문서 (snapshot-validation-v2.md) 작성",
      },
      {
        type: "feat",
        description: "카드 더블클릭으로 확장/축소 토글",
      },
      {
        type: "feat",
        description: "카드 우클릭 컨텍스트 메뉴 (JSON/Text 복사, 삭제)",
      },
      {
        type: "feat",
        description: "편집 폼 Tab 키로 순차적 필드 이동",
      },
      {
        type: "feat",
        description: "GNB 필터 반응형 개선 - 1440px 이하에서 통합 버튼",
      },
      {
        type: "feat",
        description: "Collaborator relations 복수 선택 지원 (체크박스)",
      },
      {
        type: "feat",
        description: "좌측 카드 목록 패널 드래그로 너비 조절 가능",
      },
      {
        type: "feat",
        description: "Plain Text Preview 패널 추가 (3열 모드 / 탭 토글)",
      },
      {
        type: "feat",
        description: "편집 폼 컴팩트 모드 UI (정보 밀도 향상)",
      },
      {
        type: "feat",
        description: "전체 복사 드롭다운 버튼 (JSON/Text 통합)",
      },
      {
        type: "improve",
        description: "전체 패널 동일 높이 + 개별 스크롤 구조",
      },
      {
        type: "improve",
        description: "SNB 버전 표시 - 최신 릴리즈 버전과 동적 연동",
      },
      {
        type: "improve",
        description:
          "Plain Text 복사 형식 개선 - 헤더 직후 Name 출력, 빈 줄로 구분",
      },
      {
        type: "style",
        description:
          "스냅샷 관리 전체 Airbnb 스타일 적용 (진입/카드/편집/토스트)",
      },
      {
        type: "style",
        description:
          "카드 리스트 메타 태그 표시 (Domain/Project/Module/Feature)",
      },
      {
        type: "style",
        description: "viewMode 토글 Airbnb 스타일 슬라이딩 탭",
      },
      {
        type: "style",
        description: "편집 폼 리스트 스타일 통일 (흰색 배경, hover 효과)",
      },
      {
        type: "style",
        description: "협업 네트워크 초기 높이 1.4배, 최대 높이 2배로 조정",
      },
    ],
  },
  {
    version: "2.2.0",
    date: "2025-12-09",
    title: "Airbnb 스타일 UI/UX 전면 개선",
    summary:
      "Work Map, 스냅샷 뷰어, GNB, SNB에 Airbnb 스타일의 인터랙션 애니메이션을 적용하고, 선택 모드 UX를 개선했습니다.",
    changes: [
      {
        type: "feat",
        description: "스냅샷 뷰어 선택 모드 - 카드 전체 클릭으로 선택 가능",
      },
      {
        type: "feat",
        description: "스냅샷 뷰어 우클릭 컨텍스트 메뉴 (선택 모드 토글)",
      },
      {
        type: "feat",
        description: "SNB 카테고리 접기/펼치기 기능 (분석/뷰/개인화 기본 접힘)",
      },
      {
        type: "style",
        description: "카드 호버 리프트 효과 (translateY + shadow)",
      },
      {
        type: "style",
        description: "카드 순차 등장 애니메이션 (stagger reveal)",
      },
      {
        type: "style",
        description: "GNB Glass effect 배경 (blur + 투명도)",
      },
      {
        type: "style",
        description: "SNB 메뉴 아이템 슬라이드 인터랙션",
      },
      {
        type: "style",
        description: "검색 입력 포커스 시 너비 확장 애니메이션",
      },
      {
        type: "style",
        description: "버튼/토글 둥근 모서리 및 그림자 스타일 통일",
      },
      {
        type: "improve",
        description: "전체적인 여백 및 간격 조정 (더 여유로운 레이아웃)",
      },
    ],
  },
  {
    version: "2.1.0",
    date: "2025-12-09",
    title: "GNB 필터 개선 및 스냅샷 뷰어 v2",
    summary:
      "GNB 필터를 직관적인 선택 포함 방식으로 개선하고, 스냅샷 뷰어를 v2 구조로 업그레이드했습니다.",
    changes: [
      {
        type: "feat",
        description: "GNB 필터 리셋 버튼 추가 - 모든 필터를 한 번에 초기화",
      },
      {
        type: "feat",
        description:
          "마지막 방문 페이지 자동 복원 - 브라우저 종료 후에도 이전 페이지로 이동",
      },
      {
        type: "feat",
        description: "스냅샷 뷰어 카드/리스트 보기 토글 추가",
      },
      {
        type: "feat",
        description: "Work Map breadcrumb 클릭 시 해당 레벨로 이동",
      },
      {
        type: "feat",
        description: "릴리즈 노트 페이지 추가",
      },
      {
        type: "improve",
        description: "GNB 필터 로직 개선 - 선택한 항목만 표시 (선택 포함 방식)",
      },
      {
        type: "improve",
        description: "스냅샷 카드 v2 구조 적용 (Past Week/This Week)",
      },
      {
        type: "improve",
        description: "Work Map Project/Person 토글 UI 개선",
      },
      {
        type: "style",
        description: "스냅샷 뷰어 탭 슬라이딩 애니메이션 추가",
      },
      {
        type: "style",
        description: "필터 버튼 상태 표시 개선 (적용 시 파란색 활성화)",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2025-12-08",
    title: "GNB 필터 시스템 및 Work Map 옵션 메뉴",
    summary:
      "GNB 영역에 확장 가능한 다중 필터 시스템을 추가하고, Work Map 옵션 메뉴를 개선했습니다.",
    changes: [
      {
        type: "feat",
        description:
          "GNB 확장형 다중 필터 시스템 추가 (담당자/도메인/프로젝트/모듈/피쳐)",
      },
      {
        type: "feat",
        description: "필터 상태 localStorage 지속성 추가",
      },
      {
        type: "feat",
        description: "Work Map 옵션 메뉴로 필터 기능 통합 (완료 항목 숨김)",
      },
      {
        type: "feat",
        description: "Work Map 선택 상태 localStorage 저장",
      },
      {
        type: "improve",
        description: "GNB 필터가 모든 페이지에 적용되도록 개선",
      },
    ],
  },
  {
    version: "1.9.0",
    date: "2025-12-07",
    title: "스냅샷 뷰어 및 연속성 분석",
    summary: "새로운 스냅샷 뷰어와 연속성 분석 기능을 추가했습니다.",
    changes: [
      {
        type: "feat",
        description: "스냅샷 뷰어 페이지 추가 (전체/사람별/비교/연속성 뷰)",
      },
      {
        type: "feat",
        description: "스냅샷 연속성 분석 기능 (thisWeek ↔ pastWeek 비교)",
      },
      {
        type: "feat",
        description: "스냅샷 카드 메뉴 추가 (JSON/Plain Text 복사)",
      },
      {
        type: "feat",
        description: "스냅샷 비교 기능 (다중 선택 후 비교)",
      },
    ],
  },
];
