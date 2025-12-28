/**
 * GNB 파라미터 유틸리티
 * 
 * URL search params로 GNB 상태를 동기화합니다.
 */

export interface GnbParams {
  year?: number;
  week?: number;
  rangeStart?: string;
  rangeEnd?: string;
  query?: string;
  status?: string;
  project?: string;
  domain?: string;
  author?: string;
  /** entries 페이지 전용: 날짜 범위 시작 */
  dateRangeStart?: string;
  /** entries 페이지 전용: 날짜 범위 종료 */
  dateRangeEnd?: string;
  /** entries 페이지 전용: 협업자 필터 */
  hasCollaborators?: boolean;
  /** keyset pagination cursor */
  cursor?: string;
  /** team-feed 전용: 프로젝트 필터 (다중 선택) */
  projects?: string[];
  /** team-feed 전용: 모듈 필터 (다중 선택) */
  modules?: string[];
  /** team-feed 전용: 기능 필터 (다중 선택) */
  features?: string[];
}

/**
 * URL searchParams에서 GNB 파라미터 파싱
 */
export function parseGnbParams(searchParams: URLSearchParams): GnbParams {
  const year = searchParams.get("year");
  const week = searchParams.get("week");
  
  // 다중 선택 파라미터 파싱 (comma-separated)
  const projectsParam = searchParams.get("projects");
  const modulesParam = searchParams.get("modules");
  const featuresParam = searchParams.get("features");
  
  return {
    year: year ? parseInt(year, 10) : undefined,
    week: week ? parseInt(week, 10) : undefined,
    rangeStart: searchParams.get("rangeStart") || undefined,
    rangeEnd: searchParams.get("rangeEnd") || undefined,
    query: searchParams.get("query") || undefined,
    status: searchParams.get("status") || undefined,
    project: searchParams.get("project") || undefined,
    domain: searchParams.get("domain") || undefined,
    author: searchParams.get("author") || undefined,
    dateRangeStart: searchParams.get("dateRangeStart") || undefined,
    dateRangeEnd: searchParams.get("dateRangeEnd") || undefined,
    hasCollaborators: searchParams.get("hasCollaborators") === "true" ? true : undefined,
    cursor: searchParams.get("cursor") || undefined,
    projects: projectsParam ? projectsParam.split(",").filter(Boolean) : undefined,
    modules: modulesParam ? modulesParam.split(",").filter(Boolean) : undefined,
    features: featuresParam ? featuresParam.split(",").filter(Boolean) : undefined,
  };
}

/**
 * GNB 파라미터를 URL query string으로 변환
 */
export function buildGnbQuery(params: GnbParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.year) searchParams.set("year", params.year.toString());
  if (params.week) searchParams.set("week", params.week.toString());
  if (params.rangeStart) searchParams.set("rangeStart", params.rangeStart);
  if (params.rangeEnd) searchParams.set("rangeEnd", params.rangeEnd);
  if (params.query) searchParams.set("query", params.query);
  if (params.status) searchParams.set("status", params.status);
  if (params.project) searchParams.set("project", params.project);
  if (params.domain) searchParams.set("domain", params.domain);
  if (params.author) searchParams.set("author", params.author);
  if (params.dateRangeStart) searchParams.set("dateRangeStart", params.dateRangeStart);
  if (params.dateRangeEnd) searchParams.set("dateRangeEnd", params.dateRangeEnd);
  if (params.hasCollaborators) searchParams.set("hasCollaborators", "true");
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.projects && params.projects.length > 0) searchParams.set("projects", params.projects.join(","));
  if (params.modules && params.modules.length > 0) searchParams.set("modules", params.modules.join(","));
  if (params.features && params.features.length > 0) searchParams.set("features", params.features.join(","));
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * GNB 파라미터가 비어있는지 확인
 */
export function isGnbParamsEmpty(params: GnbParams): boolean {
  return (
    !params.year &&
    !params.week &&
    !params.rangeStart &&
    !params.rangeEnd &&
    !params.query &&
    !params.status &&
    !params.project &&
    !params.domain &&
    !params.author &&
    !params.dateRangeStart &&
    !params.dateRangeEnd &&
    !params.hasCollaborators &&
    !params.cursor &&
    (!params.projects || params.projects.length === 0) &&
    (!params.modules || params.modules.length === 0) &&
    (!params.features || params.features.length === 0)
  );
}

/**
 * 주차를 사람이 읽기 좋은 형식으로 변환
 */
export function formatWeekDisplay(year: number, week: number): string {
  // ISO 주차 시작일 계산
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const formatDate = (d: Date) => 
    `${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
  
  return `${year}-W${week.toString().padStart(2, "0")} (${formatDate(weekStart)}~${formatDate(weekEnd)})`;
}





















