import type { Release } from "./types";

export const RELEASES: Release[] = [
  {
    version: "2.3.0",
    date: "2025-12-10",
    title: "스냅샷 관리 시스템 및 Airbnb 스타일 전면 개편",
    summary:
      "스냅샷 관리 페이지를 추가하고 v2 스키마 가이드/검증 문서를 정립했습니다. 전체 화면을 Airbnb 스타일로 개편하고, 더블클릭 확장, 우클릭 컨텍스트 메뉴, Tab 키 순차 이동 기능을 추가했습니다.",
    changes: [
      {
        type: "feat",
        description: "스냅샷 관리 페이지 추가 - 데이터 로드/신규 생성/편집 기능",
      },
      {
        type: "feat",
        description: "v2 스키마 가이드 문서 (snapshot-guide-v2.md) 작성",
      },
      {
        type: "feat",
        description: "v2 스키마 검증 가이드 문서 (snapshot-validation-v2.md) 작성",
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
        description: "Work Map 협업 네트워크 노드 패널 드래그 이동 지원",
      },
      {
        type: "feat",
        description: "협업 네트워크 중앙 모달 - 전체 스냅샷 리스트 표시",
      },
      {
        type: "feat",
        description: "Collaborator relations 복수 선택 지원 (체크박스)",
      },
      {
        type: "improve",
        description: "스냅샷 뷰어 뷰 모드 localStorage 저장 (전체/사람별 등)",
      },
      {
        type: "improve",
        description: "Work Map 트리 펼침 상태 localStorage 저장 버그 수정",
      },
      {
        type: "improve",
        description: "SNB 버전 표시 - 최신 릴리즈 버전과 동적 연동",
      },
      {
        type: "improve",
        description: "Plain Text 복사 형식 개선 - 헤더 직후 Name 출력, 빈 줄로 구분",
      },
      {
        type: "style",
        description: "스냅샷 관리 전체 Airbnb 스타일 적용 (진입/카드/편집/토스트)",
      },
      {
        type: "style",
        description: "카드 리스트 메타 태그 표시 (Domain/Project/Module/Feature)",
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
