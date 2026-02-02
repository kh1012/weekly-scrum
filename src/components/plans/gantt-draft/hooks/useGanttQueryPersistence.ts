/**
 * Gantt Query Persistence Hook
 * - URL queryString이 변경되면 로컬 스토리지에 저장
 * - 페이지 재방문 시 저장된 쿼리를 복원
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// 로컬 스토리지 키 prefix
const STORAGE_KEY_PREFIX = "gantt-query:";

// 저장할 쿼리 파라미터 목록
// 주의: expanded, rangeMonths, rangeStart, rangeEnd는 useGanttPersistence에서 관리하므로 제외
const PERSISTED_PARAMS = [
  "stages",
  "assignees",
  "viewMode",
  "projects",
  "modules",
  "features",
  "search",
  "flagIds",
] as const;

export interface StoredGanttParams {
  stages?: string[];
  assignees?: string[];
  viewMode?: "detailed" | "summarized";
  projects?: string[];
  modules?: string[];
  features?: string[];
  search?: string;
  flagIds?: string[];
}

interface UseGanttQueryPersistenceOptions {
  /** 로컬 스토리지 키 구분자 (예: "works", "admin") */
  storageKey: string;
  /** 쿼리 복원 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

interface UseGanttQueryPersistenceReturn {
  /** 로컬 스토리지에서 복원된 파라미터 */
  storedParams: StoredGanttParams | null;
  /** URL 복원이 완료되었는지 여부 */
  isRestored: boolean;
  /** 수동으로 현재 쿼리 저장 */
  persistCurrentQuery: () => void;
  /** 저장된 쿼리 삭제 */
  clearPersistedQuery: () => void;
}

/**
 * 로컬 스토리지에서 저장된 파라미터 가져오기 (SSR 안전)
 */
export function getStoredGanttParams(storageKey: string): StoredGanttParams | null {
  if (typeof window === "undefined") return null;
  try {
    const fullStorageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
    const stored = localStorage.getItem(fullStorageKey);
    if (!stored) return null;
    
    const raw = JSON.parse(stored) as Record<string, string>;
    const parsed: StoredGanttParams = {};
    
    if (raw.stages) parsed.stages = raw.stages.split(",").filter(Boolean);
    if (raw.assignees) parsed.assignees = raw.assignees.split(",").filter(Boolean);
    if (raw.viewMode === "summarized") parsed.viewMode = "summarized";
    else if (raw.viewMode) parsed.viewMode = "detailed";
    if (raw.projects) parsed.projects = raw.projects.split(",").filter(Boolean);
    if (raw.modules) parsed.modules = raw.modules.split(",").filter(Boolean);
    if (raw.features) parsed.features = raw.features.split(",").filter(Boolean);
    if (raw.search) parsed.search = raw.search;
    if (raw.flagIds) parsed.flagIds = raw.flagIds.split(",").filter(Boolean);
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Gantt 페이지의 queryString을 로컬 스토리지에 저장/복원하는 훅
 * 
 * @example
 * ```tsx
 * const { storedParams, isRestored } = useGanttQueryPersistence({ 
 *   storageKey: "works-plans-gantt" 
 * });
 * 
 * // storedParams를 사용하여 초기값 설정
 * const stages = isRestored && storedParams?.stages?.length 
 *   ? storedParams.stages 
 *   : initialStages;
 * ```
 */
export function useGanttQueryPersistence({
  storageKey,
  enabled = true,
}: UseGanttQueryPersistenceOptions): UseGanttQueryPersistenceReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // 전체 스토리지 키
  const fullStorageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
  
  // 저장된 파라미터 상태 - 클라이언트에서만 설정
  const [storedParams, setStoredParams] = useState<StoredGanttParams | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  
  // 마지막으로 복원한 pathname을 추적 (같은 페이지 재방문 감지용)
  const lastRestoredPathRef = useRef<string | null>(null);
  // 저장 활성화 여부 (복원 후에만 저장)
  const canSaveRef = useRef(false);
  
  // 클라이언트 마운트 시 로컬 스토리지에서 읽어오기
  useEffect(() => {
    const params = getStoredGanttParams(storageKey);
    if (params) {
      setStoredParams(params);
    }
  }, [storageKey]);

  // 저장된 쿼리 파라미터 가져오기 (raw 형태)
  const getStoredParams = useCallback((): Record<string, string> | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, [fullStorageKey]);

  // 쿼리 파라미터 저장
  const saveParams = useCallback(
    (params: URLSearchParams) => {
      if (typeof window === "undefined") return;
      try {
        const toSave: Record<string, string> = {};
        let hasParams = false;

        PERSISTED_PARAMS.forEach((key) => {
          const value = params.get(key);
          if (value) {
            toSave[key] = value;
            hasParams = true;
          }
        });

        if (hasParams) {
          localStorage.setItem(fullStorageKey, JSON.stringify(toSave));
        } else {
          // 모든 파라미터가 비어있으면 저장된 것도 삭제
          localStorage.removeItem(fullStorageKey);
        }
      } catch {
        // localStorage 접근 실패 무시
      }
    },
    [fullStorageKey]
  );

  // 페이지 진입 시 쿼리 복원 (pathname이 변경되거나 처음 마운트될 때)
  useEffect(() => {
    if (!enabled) return;
    
    // 이미 이 pathname에서 복원했으면 스킵
    if (lastRestoredPathRef.current === pathname) return;
    
    // 현재 URL에 persisted params가 하나라도 있는지 확인
    const currentParams = new URLSearchParams(searchParams.toString());
    const hasCurrentParams = PERSISTED_PARAMS.some(
      (key) => currentParams.has(key)
    );

    // 현재 URL에 persisted params가 없으면 로컬 스토리지에서 복원
    if (!hasCurrentParams) {
      const rawStoredParams = getStoredParams();
      
      if (rawStoredParams && Object.keys(rawStoredParams).length > 0) {
        // 기존 URL 파라미터 유지 (expanded, rangeMonths 등은 useGanttPersistence에서 관리)
        const newParams = new URLSearchParams(currentParams.toString());
        
        // 저장된 파라미터만 추가/업데이트
        Object.entries(rawStoredParams).forEach(([key, value]) => {
          if (value && PERSISTED_PARAMS.includes(key as typeof PERSISTED_PARAMS[number])) {
            newParams.set(key, value);
          }
        });

        const queryString = newParams.toString();
        if (queryString) {
          lastRestoredPathRef.current = pathname;
          // replace를 사용하여 히스토리 스택에 추가하지 않음
          router.replace(`${pathname}?${queryString}`, { scroll: false });
          // 저장 활성화는 URL 변경 후 약간의 딜레이 후에
          setTimeout(() => {
            canSaveRef.current = true;
          }, 200);
          setIsRestored(true);
          return;
        }
      }
    }
    
    // 복원할 것이 없어도 이 pathname에서 처리 완료로 마킹
    lastRestoredPathRef.current = pathname;
    canSaveRef.current = true;
    setIsRestored(true);
  }, [enabled, searchParams, pathname, router, getStoredParams, fullStorageKey]);

  // 쿼리 파라미터 변경 시 저장
  useEffect(() => {
    // 저장이 활성화되지 않았으면 스킵
    if (!canSaveRef.current) return;
    
    // 약간의 지연 후 저장 (복원과 충돌 방지)
    const timer = setTimeout(() => {
      saveParams(new URLSearchParams(searchParams.toString()));
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, saveParams]);

  // 수동으로 쿼리 저장하기 (필요시 사용)
  const persistCurrentQuery = useCallback(() => {
    saveParams(new URLSearchParams(searchParams.toString()));
  }, [searchParams, saveParams]);

  // 저장된 쿼리 삭제하기
  const clearPersistedQuery = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(fullStorageKey);
    } catch {
      // localStorage 접근 실패 무시
    }
  }, [fullStorageKey]);

  return {
    storedParams,
    isRestored,
    persistCurrentQuery,
    clearPersistedQuery,
  };
}
