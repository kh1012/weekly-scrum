/**
 * WorkMap 필터 상태 지속성 모듈
 *
 * LocalStorage에 저장되는 필터 상태:
 * - hideCompleted: 100% 완료 항목 숨김 여부
 * - expandedProjects: 펼쳐진 프로젝트 목록
 * - expandedModules: 펼쳐진 모듈 목록
 * - viewMode: 트리 뷰 모드 (project | person)
 * - expandedPersons: 펼쳐진 사람 목록
 * - expandedDomains: 펼쳐진 도메인 목록
 * - expandedPersonProjects: 펼쳐진 사람-프로젝트 목록
 * - expandedPersonModules: 펼쳐진 사람-모듈 목록
 */

export const STORAGE_KEY = "workmap-filter-state";

export interface WorkMapFilterState {
  hideCompleted: boolean;
  viewMode: "project" | "person";
  expandedProjects: string[];
  expandedModules: string[];
  expandedPersons: string[];
  expandedDomains: string[];
  expandedPersonProjects: string[];
  expandedPersonModules: string[];
}

const defaultState: WorkMapFilterState = {
  hideCompleted: false,
  viewMode: "project",
  expandedProjects: [],
  expandedModules: [],
  expandedPersons: [],
  expandedDomains: [],
  expandedPersonProjects: [],
  expandedPersonModules: [],
};

/**
 * LocalStorage에서 상태 읽기
 */
export function loadFilterState(): WorkMapFilterState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }

    const parsed = JSON.parse(stored);
    return {
      ...defaultState,
      ...parsed,
    };
  } catch {
    console.warn("Failed to load WorkMap filter state from localStorage");
    return defaultState;
  }
}

/**
 * LocalStorage에 상태 저장
 */
export function saveFilterState(state: Partial<WorkMapFilterState>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = loadFilterState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    console.warn("Failed to save WorkMap filter state to localStorage");
  }
}

/**
 * URL QueryString에서 상태 파싱
 */
export function parseQueryString(): Partial<WorkMapFilterState> {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const result: Partial<WorkMapFilterState> = {};

  // hideCompleted
  const hideCompleted = params.get("hideCompleted");
  if (hideCompleted !== null) {
    result.hideCompleted = hideCompleted === "true";
  }

  // viewMode
  const viewMode = params.get("viewMode");
  if (viewMode === "project" || viewMode === "person") {
    result.viewMode = viewMode;
  }

  return result;
}

/**
 * 상태를 QueryString으로 변환
 */
export function toQueryString(
  state: Pick<WorkMapFilterState, "hideCompleted" | "viewMode">
): string {
  const params = new URLSearchParams();

  if (state.hideCompleted) {
    params.set("hideCompleted", "true");
  }

  if (state.viewMode !== "project") {
    params.set("viewMode", state.viewMode);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * URL 업데이트 (히스토리 교체)
 */
export function updateQueryString(
  state: Pick<WorkMapFilterState, "hideCompleted" | "viewMode">
): void {
  if (typeof window === "undefined") {
    return;
  }

  const queryString = toQueryString(state);
  const newUrl = window.location.pathname + queryString;

  // 현재 URL과 다를 때만 업데이트
  if (window.location.pathname + window.location.search !== newUrl) {
    window.history.replaceState(null, "", newUrl);
  }
}

export { useWorkMapPersistence } from "./useWorkMapPersistence";

