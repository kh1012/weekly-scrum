/**
 * Gantt 상태 지속성 Hook
 *
 * - expandedNodes: 트리 접기/펼치기 상태
 * - rangeMonths, rangeStart, rangeEnd: 기간 선택 상태
 *
 * 우선순위: URL > localStorage > default
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getItem, setItem } from "@/lib/utils/storage";
import { shouldShortenUrl } from "@/lib/utils/shortLink";
import { createShortLinkAction } from "@/lib/actions/shortLinkActions";

const STORAGE_KEY = "gantt-view-state";

interface StoredGanttState {
  expandedNodes: string[];
  rangeMonths: number | null;
  rangeStart: string | null; // ISO date string
  rangeEnd: string | null; // ISO date string
}

interface UseGanttPersistenceProps {
  workspaceId: string;
  expandedNodes: string[];
  rangeMonths: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onExpandedNodesChange: (nodes: string[]) => void;
  onRangeMonthsChange: (months: number) => void;
  onRangeStartChange: (date: Date) => void;
  onRangeEndChange: (date: Date) => void;
  /** URL이 길어질 경우 자동 축약 여부 (기본: true) */
  autoShorten?: boolean;
  /** URL 축약 임계값 (기본: 2000자) */
  shortenThreshold?: number;
}

/**
 * URL 쿼리 파라미터에서 상태 파싱
 */
function parseQueryParams(
  searchParams: URLSearchParams,
): Partial<StoredGanttState> {
  const result: Partial<StoredGanttState> = {};

  // expandedNodes (쉼표로 구분된 문자열)
  const expandedParam = searchParams.get("expanded");
  if (expandedParam) {
    result.expandedNodes = expandedParam.split(",").filter(Boolean);
  }

  // rangeMonths
  const rangeMonthsParam = searchParams.get("rangeMonths");
  if (rangeMonthsParam) {
    const months = parseInt(rangeMonthsParam, 10);
    if (!isNaN(months) && months >= 0) {
      result.rangeMonths = months;
    }
  }

  // rangeStart, rangeEnd (ISO date string)
  const rangeStartParam = searchParams.get("rangeStart");
  if (rangeStartParam) {
    result.rangeStart = rangeStartParam;
  }

  const rangeEndParam = searchParams.get("rangeEnd");
  if (rangeEndParam) {
    result.rangeEnd = rangeEndParam;
  }

  return result;
}

/**
 * 상태를 URL 쿼리 파라미터로 변환
 */
function toQueryParams(state: Partial<StoredGanttState>): URLSearchParams {
  const params = new URLSearchParams();

  if (state.expandedNodes && state.expandedNodes.length > 0) {
    params.set("expanded", state.expandedNodes.join(","));
  }

  if (state.rangeMonths !== null && state.rangeMonths !== undefined) {
    params.set("rangeMonths", String(state.rangeMonths));
  }

  if (state.rangeStart) {
    params.set("rangeStart", state.rangeStart);
  }

  if (state.rangeEnd) {
    params.set("rangeEnd", state.rangeEnd);
  }

  return params;
}

interface UseGanttPersistenceReturn {
  /** 초기화 완료 여부 */
  isInitialized: boolean;
  /** URL/localStorage에 expanded 파라미터가 있었는지 */
  hasExpandedInSource: boolean;
}

export function useGanttPersistence({
  workspaceId,
  expandedNodes,
  rangeMonths,
  rangeStart,
  rangeEnd,
  onExpandedNodesChange,
  onRangeMonthsChange,
  onRangeStartChange,
  onRangeEndChange,
  autoShorten = true,
  shortenThreshold = 2000,
}: UseGanttPersistenceProps): UseGanttPersistenceReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitializedRef = useRef(false);
  const shouldSaveRef = useRef(false);
  const shorteningRef = useRef(false);
  const shortLinkFailedRef = useRef(false); // shortLink 실패 시 재시도 방지
  const hasExpandedInSourceRef = useRef(false); // URL/localStorage에 expanded가 있었는지
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 상태 복원 (URL > localStorage > default)
  useEffect(() => {
    if (isInitializedRef.current) return;

    // 브라우저 환경에서만 실행
    if (typeof window === "undefined") return;

    // window.location.search를 직접 사용하여 URL 파라미터 파싱
    // Next.js useSearchParams는 초기 렌더링 시 비어있을 수 있어서 직접 파싱
    const urlSearchParams = new URLSearchParams(window.location.search);
    const urlState = parseQueryParams(urlSearchParams);

    // localStorage에서 로드
    const storageKey = `${STORAGE_KEY}:${workspaceId}`;
    const storedState = getItem<StoredGanttState>(storageKey);

    // 우선순위: URL > localStorage
    const mergedState: Partial<StoredGanttState> = {
      ...(storedState || {}),
      ...urlState, // URL이 우선
    };

    // URL 또는 localStorage에 expanded가 있는지 확인
    const hasExpandedInUrl = urlState.expandedNodes && urlState.expandedNodes.length > 0;
    const hasExpandedInStorage = storedState?.expandedNodes && storedState.expandedNodes.length > 0;
    hasExpandedInSourceRef.current = hasExpandedInUrl || hasExpandedInStorage;

    // 상태 적용
    if (mergedState.expandedNodes && mergedState.expandedNodes.length > 0) {
      onExpandedNodesChange(mergedState.expandedNodes);
    }

    if (
      mergedState.rangeMonths !== null &&
      mergedState.rangeMonths !== undefined
    ) {
      onRangeMonthsChange(mergedState.rangeMonths);
    }

    if (mergedState.rangeStart) {
      const startDate = new Date(mergedState.rangeStart);
      if (!isNaN(startDate.getTime())) {
        onRangeStartChange(startDate);
      }
    }

    if (mergedState.rangeEnd) {
      const endDate = new Date(mergedState.rangeEnd);
      if (!isNaN(endDate.getTime())) {
        onRangeEndChange(endDate);
      }
    }

    isInitializedRef.current = true;
    shouldSaveRef.current = true;
    setIsInitialized(true);

    // URL에 파라미터가 없고 localStorage에서 복원한 경우, URL도 업데이트
    const hasUrlParams = urlSearchParams.toString().length > 0;
    const hasStoredData = storedState && (
      (storedState.expandedNodes?.length ?? 0) > 0 ||
      storedState.rangeMonths !== null ||
      storedState.rangeStart !== null ||
      storedState.rangeEnd !== null
    );

    if (!hasUrlParams && hasStoredData) {
      const params = toQueryParams(mergedState);
      const queryString = params.toString();
      if (queryString) {
        const currentPath = window.location.pathname;
        window.history.replaceState(null, "", `${currentPath}?${queryString}`);
      }
    }
  }, [
    workspaceId,
    onExpandedNodesChange,
    onRangeMonthsChange,
    onRangeStartChange,
    onRangeEndChange,
  ]);

  // 상태 변경 시 localStorage 저장 및 URL 동기화
  useEffect(() => {
    if (!isInitializedRef.current || !shouldSaveRef.current) return;

    const storageKey = `${STORAGE_KEY}:${workspaceId}`;
    const stateToSave: StoredGanttState = {
      expandedNodes,
      rangeMonths: rangeMonths || null,
      rangeStart: rangeStart ? rangeStart.toISOString().split("T")[0] : null,
      rangeEnd: rangeEnd ? rangeEnd.toISOString().split("T")[0] : null,
    };

    // localStorage에 저장
    setItem(storageKey, stateToSave);

    // URL 동기화
    const params = toQueryParams(stateToSave);
    const currentParams = new URLSearchParams(searchParams.toString());

    // 기존 파라미터와 비교하여 변경된 경우만 업데이트
    let hasChanges = false;
    const newParams = new URLSearchParams();

    // expandedNodes
    const expandedParam = params.get("expanded");
    const currentExpanded = currentParams.get("expanded");
    if (expandedParam !== currentExpanded) {
      hasChanges = true;
      if (expandedParam) {
        newParams.set("expanded", expandedParam);
      }
    } else if (currentExpanded) {
      newParams.set("expanded", currentExpanded);
    }

    // rangeMonths
    const rangeMonthsParam = params.get("rangeMonths");
    const currentRangeMonths = currentParams.get("rangeMonths");
    if (rangeMonthsParam !== currentRangeMonths) {
      hasChanges = true;
      if (rangeMonthsParam) {
        newParams.set("rangeMonths", rangeMonthsParam);
      }
    } else if (currentRangeMonths) {
      newParams.set("rangeMonths", currentRangeMonths);
    }

    // rangeStart
    const rangeStartParam = params.get("rangeStart");
    const currentRangeStart = currentParams.get("rangeStart");
    if (rangeStartParam !== currentRangeStart) {
      hasChanges = true;
      if (rangeStartParam) {
        newParams.set("rangeStart", rangeStartParam);
      }
    } else if (currentRangeStart) {
      newParams.set("rangeStart", currentRangeStart);
    }

    // rangeEnd
    const rangeEndParam = params.get("rangeEnd");
    const currentRangeEnd = currentParams.get("rangeEnd");
    if (rangeEndParam !== currentRangeEnd) {
      hasChanges = true;
      if (rangeEndParam) {
        newParams.set("rangeEnd", rangeEndParam);
      }
    } else if (currentRangeEnd) {
      newParams.set("rangeEnd", currentRangeEnd);
    }

    // 기존 파라미터 유지 (expanded, rangeMonths, rangeStart, rangeEnd 제외)
    for (const [key, value] of currentParams.entries()) {
      if (
        !["expanded", "rangeMonths", "rangeStart", "rangeEnd"].includes(key)
      ) {
        newParams.set(key, value);
      }
    }

    // URL 업데이트 (window.history.replaceState 사용 - 서버 컴포넌트 재실행 방지)
    if (hasChanges) {
      const newQueryString = newParams.toString();

      // URL이 길어지면 자동 축약 (이 경우에만 router.replace 사용)
      // shortLinkFailedRef가 true이면 이전에 실패했으므로 재시도하지 않음
      if (
        autoShorten &&
        shouldShortenUrl(newQueryString, shortenThreshold) &&
        !shorteningRef.current &&
        !shortLinkFailedRef.current
      ) {
        shorteningRef.current = true;

        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        createShortLinkAction({
          workspaceId,
          originalUrl: currentPath,
          queryString: newQueryString,
        }).then((result) => {
          shorteningRef.current = false;
          if (result.success) {
            // 축약된 URL로 리다이렉트 (서버 이동 필요)
            router.replace(`/s/${result.shortId}`, { scroll: false });
          } else {
            // 축약 실패 시 더 이상 시도하지 않도록 마킹
            shortLinkFailedRef.current = true;
            // 일반 URL 사용 (history API)
            const fallbackPath =
              typeof window !== "undefined" ? window.location.pathname : "";
            const newUrl = newQueryString ? `${fallbackPath}?${newQueryString}` : fallbackPath;
            window.history.replaceState(null, "", newUrl);
          }
        });
      } else {
        // 일반 URL 업데이트 - window.history.replaceState 사용 (서버 재실행 방지)
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "";
        const newUrl = newQueryString ? `${currentPath}?${newQueryString}` : currentPath;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [
    workspaceId,
    expandedNodes,
    rangeMonths,
    rangeStart,
    rangeEnd,
    router,
    searchParams,
    autoShorten,
    shortenThreshold,
  ]);

  return {
    isInitialized,
    hasExpandedInSource: hasExpandedInSourceRef.current,
  };
}
