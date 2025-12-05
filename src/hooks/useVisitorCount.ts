"use client";

import { useState, useEffect, useRef } from "react";

interface VisitorCountState {
  count: number;
  isLoading: boolean;
  error: string | null;
}

const VISITOR_SESSION_KEY = "weekly-scrum-visited";
const VISITOR_KEY = "weekly-scrum:visitors";

// 클라이언트에서 직접 Upstash REST API 호출 (GitHub Pages 정적 배포용)
const UPSTASH_URL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;

interface UpstashResponse {
  result: number | null;
}

async function incrementCount(): Promise<number> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn("Upstash credentials not configured");
    return 0;
  }

  const response = await fetch(`${UPSTASH_URL}/incr/${VISITOR_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: UpstashResponse = await response.json();
  return data.result ?? 0;
}

async function getCount(): Promise<number> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn("Upstash credentials not configured");
    return 0;
  }

  const response = await fetch(`${UPSTASH_URL}/get/${VISITOR_KEY}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: UpstashResponse = await response.json();
  return data.result ?? 0;
}

export function useVisitorCount(): VisitorCountState {
  const [state, setState] = useState<VisitorCountState>({
    count: 0,
    isLoading: true,
    error: null,
  });
  const hasTracked = useRef(false);

  useEffect(() => {
    async function trackAndFetch() {
      // Upstash 설정이 없으면 스킵
      if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        setState({
          count: 0,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const hasVisited = sessionStorage.getItem(VISITOR_SESSION_KEY);

        if (!hasVisited && !hasTracked.current) {
          hasTracked.current = true;
          const count = await incrementCount();
          sessionStorage.setItem(VISITOR_SESSION_KEY, "true");
          
          setState({
            count,
            isLoading: false,
            error: null,
          });
        } else {
          const count = await getCount();
          
          setState({
            count,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Visitor count error:", error);
        setState({
          count: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    trackAndFetch();
  }, []);

  return state;
}

