import type { Release } from "./types";

export const RELEASES: Release[] = [
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
