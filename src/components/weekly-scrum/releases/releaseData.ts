import type { Release } from "./types";

export const RELEASES: Release[] = [
  {
    version: "2.1.0",
    date: "2025-12-09",
    title: "스냅샷 뷰어 v2 구조 및 Work Map 개선",
    summary: "스냅샷 카드를 v2 구조(Past Week/This Week)로 전환하고, Work Map UI를 개선했습니다.",
    changes: [
      {
        type: "feat",
        description: "스냅샷 뷰어에 카드/리스트 보기 토글 추가",
      },
      {
        type: "feat",
        description: "Work Map의 Project/Person 탭을 토글 형태로 변경",
      },
      {
        type: "feat",
        description: "Work Map breadcrumb 클릭 시 해당 레벨로 이동 기능 추가",
      },
      {
        type: "feat",
        description: "릴리즈 노트 페이지 추가",
      },
      {
        type: "improve",
        description: "스냅샷 카드 v2 구조 적용 (Past Week/This Week)",
      },
      {
        type: "improve",
        description: "스냅샷 뷰어 탭 슬라이딩 애니메이션 추가",
      },
      {
        type: "improve",
        description: "스냅샷 뷰어 사람별 보기 필터 제거 (GNB 필터로 대체)",
      },
      {
        type: "style",
        description: "뷰 모드 토글 스타일 개선 (흰색 배경, 파란색 하이라이트)",
      },
      {
        type: "style",
        description: "카드 내부 회색 배경 삭제 (진행률 바 제외)",
      },
      {
        type: "style",
        description: "컨텐츠 영역 개선 ('진행 중' 헤더 삭제, '완료된 항목' 하단 표시)",
      },
      {
        type: "refactor",
        description: "ScrumListItem 컴포넌트 추가 (리스트 형태 스냅샷 표시)",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2025-12-08",
    title: "GNB 필터 시스템 및 Work Map 옵션 메뉴",
    summary: "GNB 영역에 확장 가능한 다중 필터 시스템을 추가하고, Work Map 옵션 메뉴를 개선했습니다.",
    changes: [
      {
        type: "feat",
        description: "GNB 확장형 다중 필터 시스템 추가 (담당자/도메인/프로젝트/모듈/피쳐)",
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

