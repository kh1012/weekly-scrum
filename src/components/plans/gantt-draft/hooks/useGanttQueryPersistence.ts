/**
 * Gantt Query Persistence Hook
 * - URL queryString이 변경되면 로컬 스토리지에 저장
 * - 페이지 재방문 시 저장된 쿼리를 복원
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// 로컬 스토리지 키 prefix
const STORAGE_KEY_PREFIX = "gantt-query:";

// 저장할 쿼리 파라미터 목록
const PERSISTED_PARAMS = [
  "stages",
  "assignees",
  "viewMode",
  "expanded",
  "projects",
  "modules",
  "features",
  "search",
  "flagIds",
] as const;

interface UseGanttQueryPersistenceOptions {
  /** 로컬 스토리지 키 구분자 (예: "works", "admin") */
  storageKey: string;
  /** 쿼리 복원 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

/**
 * Gantt 페이지의 queryString을 로컬 스토리지에 저장/복원하는 훅
 * 
 * @example
 * ```tsx
 * useGanttQueryPersistence({ storageKey: "works" });
 * ```
 */
export function useGanttQueryPersistence({
  storageKey,
  enabled = true,
}: UseGanttQueryPersistenceOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isInitialMount = useRef(true);
  const hasRestoredRef = useRef(false);

  // 전체 스토리지 키
  const fullStorageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;

  // 저장된 쿼리 파라미터 가져오기
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

  // 초기 마운트 시 쿼리 복원
  useEffect(() => {
    if (!enabled || !isInitialMount.current || hasRestoredRef.current) return;
    isInitialMount.current = false;

    // 현재 URL에 persisted params가 하나라도 있는지 확인
    const currentParams = new URLSearchParams(searchParams.toString());
    const hasCurrentParams = PERSISTED_PARAMS.some(
      (key) => currentParams.has(key)
    );

    // 현재 URL에 파라미터가 없으면 로컬 스토리지에서 복원
    if (!hasCurrentParams) {
      const storedParams = getStoredParams();
      if (storedParams && Object.keys(storedParams).length > 0) {
        const newParams = new URLSearchParams();
        Object.entries(storedParams).forEach(([key, value]) => {
          if (value) {
            newParams.set(key, value);
          }
        });

        const queryString = newParams.toString();
        if (queryString) {
          hasRestoredRef.current = true;
          // replace를 사용하여 히스토리 스택에 추가하지 않음
          router.replace(`${pathname}?${queryString}`, { scroll: false });
        }
      }
    }
  }, [enabled, searchParams, pathname, router, getStoredParams]);

  // 쿼리 파라미터 변경 시 저장 (초기 복원 이후)
  useEffect(() => {
    // 초기 마운트나 복원 직후에는 저장하지 않음
    if (isInitialMount.current) return;
    
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
    persistCurrentQuery,
    clearPersistedQuery,
  };
}
