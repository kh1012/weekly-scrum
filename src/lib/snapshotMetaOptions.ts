/**
 * 스냅샷 메타 필드 옵션 정의
 * 
 * 이 파일은 스냅샷 편집 시 사용되는 콤보박스 옵션을 관리합니다.
 * 각 배열의 마지막 요소는 "사용자 정의"로, 자유 입력을 허용합니다.
 */

/**
 * Domain 옵션
 * 업무 관점의 최상위 분류
 */
export const DOMAIN_OPTIONS = [
  "Planning",
  "Design",
  "Frontend",
  "Backend",
  "Operation",
  "Collaboration",
  "Content",
  "Research",
] as const;

/**
 * Project 옵션
 * 업무가 속한 실질적 프로젝트
 */
export const PROJECT_OPTIONS = [
  "MOTIIV",
  "M-Connector",
  "M-Desk",
  "Idea-forge",
] as const;

/**
 * Module 옵션 (프로젝트별)
 * 프로젝트 내부 하위 영역
 * 
 * MOTIIV 모듈 설명:
 * - Home: 홈 화면
 * - Discovery: Article, Projects, Portfolio 등
 * - Spreadsheet: 스프레드시트 기능
 * - Workspace: Team Project 등
 * - Account: 프로필, 계정, 설정
 * - Engagement System: 인기 컨텐츠, 뱃지, 알림, 이메일 등
 * - Navigation: IA, 메뉴 설계 변경, 페이지 구조 개편 등
 * - Tracking: HubSpot, GA 등 활동 기반 데이터 추적
 */
export const MODULE_OPTIONS: Record<string, readonly string[]> = {
  MOTIIV: [
    "Home",
    "Discovery",
    "Spreadsheet",
    "Workspace",
    "Account",
    "Engagement System",
    "Navigation",
    "Tracking",
  ],
  "M-Connector": [],
  "M-Desk": [],
  "Idea-forge": [],
} as const;

/**
 * 모든 모듈 옵션 (프로젝트 무관)
 * MOTIIV 기준 모듈 목록
 */
export const ALL_MODULE_OPTIONS = [
  "Home",
  "Discovery",
  "Spreadsheet",
  "Workspace",
  "Account",
  "Engagement System",
  "Navigation",
  "Tracking",
] as const;

/**
 * Feature 옵션 (공통)
 * 모듈 내 구체적인 기능 단위
 * 자주 사용되는 기능명 목록
 */
export const FEATURE_OPTIONS = [
  "Rich-note",
  "Import-Engine",
  "Login-Flow",
  "Cell-Rendering",
  "Formula-Tracer",
  "Data-Validation",
  "Export-Engine",
  "Permission-System",
  "Notification-Center",
  "Search-Engine",
] as const;

/**
 * 팀원 이름 옵션
 */
export const NAME_OPTIONS = [
  "김현",
  "김서연",
  "박민수",
  "조해용",
  "하성열",
  "이준호",
  "장지원",
  "최유진",
  "정민혁",
  "송다은",
] as const;

/**
 * 협업 관계 옵션
 */
export const RELATION_OPTIONS = ["pair", "pre", "post"] as const;

/**
 * 리스크 레벨 옵션
 */
export const RISK_LEVEL_OPTIONS = [
  { value: 0, label: "없음", description: "리스크 없음" },
  { value: 1, label: "경미", description: "업무 외적 부담, 일정 영향 없음" },
  { value: 2, label: "중간", description: "병목 가능성 있음, 일정 영향 가능" },
  { value: 3, label: "심각", description: "즉각적인 논의 필요, 일정 지연 확정" },
] as const;

/**
 * 사용자 정의 입력 상수
 */
export const CUSTOM_INPUT_VALUE = "__CUSTOM__" as const;

/**
 * 옵션 타입
 */
export type DomainOption = (typeof DOMAIN_OPTIONS)[number];
export type ProjectOption = (typeof PROJECT_OPTIONS)[number];
export type NameOption = (typeof NAME_OPTIONS)[number];
export type RelationOption = (typeof RELATION_OPTIONS)[number];
export type RiskLevelOption = (typeof RISK_LEVEL_OPTIONS)[number];
