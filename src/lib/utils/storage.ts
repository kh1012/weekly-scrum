/**
 * LocalStorage 유틸리티
 * 
 * 프로젝트 전반에 걸쳐 사용되는 localStorage 패턴을 통합합니다.
 * - 타입 안전성 보장
 * - 에러 처리
 * - SSR 호환성
 */

// ========================================
// 기본 Storage 유틸리티
// ========================================

/**
 * localStorage에서 값 읽기
 * SSR 환경에서 안전하게 동작하며, 파싱 에러 처리 포함
 */
export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return null;
  }
}

/**
 * localStorage에 값 저장
 * SSR 환경에서 안전하게 동작하며, 직렬화 에러 처리 포함
 */
export function setItem<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * localStorage에서 값 제거
 */
export function removeItem(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * localStorage 전체 비우기
 */
export function clear(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn("Failed to clear localStorage:", error);
    return false;
  }
}

/**
 * localStorage에 키가 존재하는지 확인
 */
export function hasKey(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

// ========================================
// 기본값 지원 Storage 유틸리티
// ========================================

/**
 * localStorage에서 값 읽기 (기본값 지원)
 */
export function getItemWithDefault<T>(key: string, defaultValue: T): T {
  const item = getItem<T>(key);
  return item !== null ? item : defaultValue;
}

/**
 * localStorage에서 값 읽기 또는 초기화 함수 실행
 * 값이 없으면 initializer를 실행하고 저장한 후 반환
 */
export function getOrInitialize<T>(
  key: string,
  initializer: () => T
): T {
  const existing = getItem<T>(key);
  if (existing !== null) {
    return existing;
  }
  
  const initialized = initializer();
  setItem(key, initialized);
  return initialized;
}

// ========================================
// 타입별 Storage 유틸리티
// ========================================

/**
 * 문자열 값 저장/읽기
 */
export function getString(key: string, defaultValue?: string): string | null {
  if (typeof window === "undefined") {
    return defaultValue ?? null;
  }
  
  try {
    const value = localStorage.getItem(key);
    return value ?? (defaultValue ?? null);
  } catch (error) {
    console.warn(`Failed to read string from localStorage (${key}):`, error);
    return defaultValue ?? null;
  }
}

export function setString(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write string to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * 숫자 값 저장/읽기
 */
export function getNumber(key: string, defaultValue?: number): number | null {
  const value = getString(key);
  if (value === null) {
    return defaultValue ?? null;
  }
  
  const num = Number(value);
  return isNaN(num) ? (defaultValue ?? null) : num;
}

export function setNumber(key: string, value: number): boolean {
  return setString(key, String(value));
}

/**
 * 불리언 값 저장/읽기
 */
export function getBoolean(key: string, defaultValue?: boolean): boolean | null {
  const value = getString(key);
  if (value === null) {
    return defaultValue ?? null;
  }
  
  return value === "true";
}

export function setBoolean(key: string, value: boolean): boolean {
  return setString(key, String(value));
}

// ========================================
// 배치 작업 유틸리티
// ========================================

/**
 * 여러 키-값 쌍을 한 번에 저장
 */
export function setMultiple(items: Record<string, unknown>): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return true;
  } catch (error) {
    console.warn("Failed to write multiple items to localStorage:", error);
    return false;
  }
}

/**
 * 여러 키의 값을 한 번에 읽기
 */
export function getMultiple<T = unknown>(keys: string[]): Record<string, T | null> {
  const result: Record<string, T | null> = {};
  
  keys.forEach((key) => {
    result[key] = getItem<T>(key);
  });
  
  return result;
}

/**
 * 여러 키를 한 번에 제거
 */
export function removeMultiple(keys: string[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    keys.forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.warn("Failed to remove multiple items from localStorage:", error);
    return false;
  }
}

// ========================================
// 네임스페이스 기반 Storage
// ========================================

/**
 * 네임스페이스를 접두사로 사용하는 Storage 인터페이스
 */
export class NamespacedStorage {
  private namespace: string;
  
  constructor(namespace: string) {
    this.namespace = namespace;
  }
  
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
  
  get<T>(key: string): T | null {
    return getItem<T>(this.getKey(key));
  }
  
  set<T>(key: string, value: T): boolean {
    return setItem(this.getKey(key), value);
  }
  
  remove(key: string): boolean {
    return removeItem(this.getKey(key));
  }
  
  has(key: string): boolean {
    return hasKey(this.getKey(key));
  }
  
  getWithDefault<T>(key: string, defaultValue: T): T {
    return getItemWithDefault(this.getKey(key), defaultValue);
  }
  
  /**
   * 네임스페이스에 속한 모든 키 조회
   */
  getAllKeys(): string[] {
    if (typeof window === "undefined") {
      return [];
    }
    
    try {
      const prefix = `${this.namespace}:`;
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key.slice(prefix.length));
        }
      }
      
      return keys;
    } catch {
      return [];
    }
  }
  
  /**
   * 네임스페이스에 속한 모든 항목 제거
   */
  clearAll(): boolean {
    const keys = this.getAllKeys();
    if (keys.length === 0) {
      return true;
    }
    
    return removeMultiple(keys.map((k) => this.getKey(k)));
  }
}

// ========================================
// Storage Hook 팩토리
// ========================================

/**
 * 특정 키에 대한 Storage 접근자를 생성하는 팩토리
 * React 컴포넌트에서 커스텀 훅과 함께 사용하기 좋음
 */
export function createStorageAccessor<T>(key: string, defaultValue: T) {
  return {
    get: () => getItemWithDefault(key, defaultValue),
    set: (value: T) => setItem(key, value),
    remove: () => removeItem(key),
    has: () => hasKey(key),
  };
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * localStorage 사용 가능 여부 확인
 */
export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * localStorage 용량 확인 (대략적인 추정치, 바이트 단위)
 */
export function getStorageSize(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  
  try {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
    return size * 2; // UTF-16 encoding (2 bytes per character)
  } catch {
    return 0;
  }
}

/**
 * localStorage에 저장된 모든 키 조회
 */
export function getAllKeys(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  } catch {
    return [];
  }
}
