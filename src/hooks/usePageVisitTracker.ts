/**
 * usePageVisitTracker Hook
 * 
 * 페이지 방문을 추적하여 user_page_visits 테이블에 기록
 * 
 * 추적 규칙:
 * - path 변경 시 로그
 * - 같은 path이지만 마지막 로그로부터 10분 이상 경과 시 로그
 * - 실패 시 네비게이션 차단하지 않음 (silent fail)
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const LAST_LOG_KEY = "page_visit_last_log";
const LOG_INTERVAL_MS = 10 * 60 * 1000; // 10분

interface LastLogInfo {
  path: string;
  timestamp: number;
}

/**
 * 페이지 방문 추적 Hook
 */
export function usePageVisitTracker({
  workspaceId,
  userId,
  enabled = true,
}: {
  workspaceId?: string;
  userId?: string;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const isLoggingRef = useRef(false);

  useEffect(() => {
    // Disabled or missing required params
    if (!enabled || !workspaceId || !userId) {
      return;
    }

    // 마지막 로그 정보 읽기
    let lastLog: LastLogInfo | null = null;
    try {
      const stored = sessionStorage.getItem(LAST_LOG_KEY);
      if (stored) {
        lastLog = JSON.parse(stored);
      }
    } catch (err) {
      // Ignore parse errors
    }

    const now = Date.now();
    const shouldLog =
      !lastLog ||
      lastLog.path !== pathname ||
      now - lastLog.timestamp >= LOG_INTERVAL_MS;

    if (!shouldLog) {
      return;
    }

    // 중복 로그 방지 (useEffect 중복 실행 방지)
    if (isLoggingRef.current) {
      return;
    }
    isLoggingRef.current = true;

    // 비동기 로그 실행
    (async () => {
      try {
        const supabase = createClient();

        await supabase.from("user_page_visits").insert({
          workspace_id: workspaceId,
          user_id: userId,
          path: pathname,
        });

        // 성공 시 sessionStorage 업데이트
        const newLog: LastLogInfo = {
          path: pathname,
          timestamp: now,
        };
        sessionStorage.setItem(LAST_LOG_KEY, JSON.stringify(newLog));
      } catch (err) {
        // Silent fail - 추적 실패가 사용자 경험을 방해하지 않도록
        console.warn("Failed to log page visit:", err);
      } finally {
        isLoggingRef.current = false;
      }
    })();
  }, [pathname, workspaceId, userId, enabled]);
}

