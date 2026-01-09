/**
 * 공통 필터링 유틸리티
 * 
 * 프로젝트 전반에 걸쳐 사용되는 필터링 로직을 통합합니다.
 * - ScrumContext
 * - WorkMapView
 * - TeamFeed
 * - 기타 필터링이 필요한 컴포넌트
 */

// ========================================
// 타입 정의
// ========================================

/**
 * 다중 선택 필터 상태
 */
export interface MultiSelectFilters {
  members?: string[];
  domains?: string[];
  projects?: string[];
  modules?: string[];
  features?: string[];
  [key: string]: string[] | undefined;
}

/**
 * 필터 가능한 아이템의 기본 인터페이스
 */
export interface FilterableItem {
  name?: string;
  domain?: string;
  project?: string;
  module?: string | null;
  topic?: string; // feature 의 별칭
  [key: string]: unknown;
}

/**
 * 검색 가능한 필드 목록
 */
export type SearchableFields<T> = (keyof T)[];

// ========================================
// 기본 필터 함수
// ========================================

/**
 * 다중 선택 필터 적용
 * 배열 형태의 필터에서 하나라도 매칭되는지 확인
 */
export function applyMultiSelectFilter(
  itemValue: string | null | undefined,
  filterValues: string[] | undefined
): boolean {
  // 필터가 비어있으면 통과
  if (!filterValues || filterValues.length === 0) {
    return true;
  }
  
  // 아이템 값이 없으면 필터 통과 실패
  if (!itemValue) {
    return false;
  }
  
  // 필터 값 중 하나라도 매칭되면 통과
  return filterValues.includes(itemValue);
}

/**
 * 다중 필터를 한 번에 적용
 */
export function applyMultiFilters<T extends FilterableItem>(
  item: T,
  filters: MultiSelectFilters,
  fieldMapping?: Partial<Record<keyof MultiSelectFilters, keyof T>>
): boolean {
  const mapping = fieldMapping || {
    members: 'name' as keyof T,
    domains: 'domain' as keyof T,
    projects: 'project' as keyof T,
    modules: 'module' as keyof T,
    features: 'topic' as keyof T,
  };
  
  // 모든 활성 필터를 순회하며 검증
  for (const [filterKey, filterValues] of Object.entries(filters)) {
    if (!filterValues || filterValues.length === 0) continue;
    
    const itemField = mapping[filterKey as keyof MultiSelectFilters];
    if (!itemField) continue;
    
    const itemValue = item[itemField] as string | null | undefined;
    
    if (!applyMultiSelectFilter(itemValue, filterValues)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 검색어 필터 적용
 * 지정된 필드들을 조합하여 검색어 매칭
 */
export function applySearchFilter<T>(
  item: T,
  searchQuery: string,
  searchableFields: SearchableFields<T>
): boolean {
  if (!searchQuery || searchQuery.trim() === "") {
    return true;
  }
  
  const searchLower = searchQuery.toLowerCase().trim();
  
  // 모든 검색 가능한 필드를 하나의 문자열로 결합
  const searchTarget = searchableFields
    .map((field) => {
      const value = item[field];
      if (Array.isArray(value)) {
        return value.join(" ");
      }
      return String(value || "");
    })
    .join(" ")
    .toLowerCase();
  
  return searchTarget.includes(searchLower);
}

/**
 * 통합 필터 적용 (다중 선택 + 검색)
 */
export function applyFilters<T extends FilterableItem>(
  items: T[],
  options: {
    multiFilters?: MultiSelectFilters;
    searchQuery?: string;
    searchableFields?: SearchableFields<T>;
    fieldMapping?: Partial<Record<keyof MultiSelectFilters, keyof T>>;
  }
): T[] {
  const {
    multiFilters = {},
    searchQuery = "",
    searchableFields = ['name', 'domain', 'project', 'module', 'topic'] as SearchableFields<T>,
    fieldMapping,
  } = options;
  
  return items.filter((item) => {
    // 다중 필터 적용
    if (!applyMultiFilters(item, multiFilters, fieldMapping)) {
      return false;
    }
    
    // 검색 필터 적용
    if (!applySearchFilter(item, searchQuery, searchableFields)) {
      return false;
    }
    
    return true;
  });
}

// ========================================
// 필터 옵션 추출
// ========================================

/**
 * 아이템 배열에서 특정 필드의 고유 값 추출
 */
export function extractUniqueValues<T>(
  items: T[],
  field: keyof T,
  options: {
    excludeEmpty?: boolean;
    sort?: boolean;
  } = {}
): string[] {
  const { excludeEmpty = true, sort = true } = options;
  
  const uniqueSet = new Set<string>();
  
  items.forEach((item) => {
    const value = item[field];
    if (value !== null && value !== undefined) {
      const strValue = String(value);
      if (!excludeEmpty || strValue.trim() !== "") {
        uniqueSet.add(strValue);
      }
    }
  });
  
  const result = Array.from(uniqueSet);
  return sort ? result.sort() : result;
}

/**
 * 여러 필드의 고유 값을 한 번에 추출
 */
export function extractMultipleUniqueValues<T>(
  items: T[],
  fields: (keyof T)[],
  options: {
    excludeEmpty?: boolean;
    sort?: boolean;
  } = {}
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  fields.forEach((field) => {
    result[String(field)] = extractUniqueValues(items, field, options);
  });
  
  return result;
}

// ========================================
// 필터 상태 관리
// ========================================

/**
 * LocalStorage에서 필터 상태 로드
 */
export function loadFilterState<T>(storageKey: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn(`Failed to load filter state from localStorage (${storageKey}):`, error);
    return null;
  }
}

/**
 * LocalStorage에 필터 상태 저장
 */
export function saveFilterState<T>(storageKey: string, state: T): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn(`Failed to save filter state to localStorage (${storageKey}):`, error);
  }
}

/**
 * LocalStorage에서 필터 상태 제거
 */
export function clearFilterState(storageKey: string): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to clear filter state from localStorage (${storageKey}):`, error);
  }
}

// ========================================
// 필터 유틸리티
// ========================================

/**
 * 활성화된 필터 개수 계산
 */
export function countActiveFilters(filters: MultiSelectFilters): number {
  return Object.values(filters).filter(
    (value) => Array.isArray(value) && value.length > 0
  ).length;
}

/**
 * 필터가 비어있는지 확인
 */
export function areFiltersEmpty(filters: MultiSelectFilters): boolean {
  return countActiveFilters(filters) === 0;
}

/**
 * 필터 초기화
 */
export function resetFilters<T extends MultiSelectFilters>(initialState: T): T {
  const reset = { ...initialState };
  
  Object.keys(reset).forEach((key) => {
    const value = reset[key];
    if (Array.isArray(value)) {
      (reset as Record<string, unknown>)[key] = [];
    }
  });
  
  return reset;
}

/**
 * 토글 필터 값 (추가/제거)
 */
export function toggleFilterValue(
  currentValues: string[],
  value: string
): string[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((v) => v !== value);
  } else {
    return [...currentValues, value];
  }
}

/**
 * 모든 값 선택
 */
export function selectAllFilterValues(
  allValues: string[]
): string[] {
  return [...allValues];
}

/**
 * 모든 값 선택 해제
 */
export function clearFilterValues(): string[] {
  return [];
}
