/**
 * URL 축약 유틸리티
 * 
 * 긴 쿼리 스트링을 Supabase의 short_links 테이블에 저장하고
 * 축약된 UUID를 포함한 공유 가능한 URL을 생성합니다.
 */

import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Database } from "@/lib/supabase/types";

export interface ShortLink {
  id: string;
  short_id: string;
  original_url: string;
  query_string: string;
  created_at: string;
  expires_at?: string | null;
  access_count: number;
  last_accessed_at?: string | null;
}

/**
 * URL에서 short_id 추출
 */
export function extractShortId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const shortIdIndex = pathParts.findIndex((part) => part === "s");
    
    if (shortIdIndex !== -1 && pathParts[shortIdIndex + 1]) {
      return pathParts[shortIdIndex + 1];
    }
    
    // 쿼리 파라미터에서도 확인
    const shortIdParam = urlObj.searchParams.get("s");
    if (shortIdParam) {
      return shortIdParam;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 축약된 URL 생성
 */
export function createShortUrl(shortId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/s/${shortId}`;
}

/**
 * short_links 테이블에 링크 저장
 */
export async function createShortLink(params: {
  workspaceId?: string;
  originalUrl: string;
  queryString: string;
  expiresAt?: Date;
}): Promise<{ success: true; shortId: string; shortUrl: string } | { success: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();

    // short_id 생성 (UUID의 앞 8자리 사용, URL-safe)
    const uuid = crypto.randomUUID();
    const shortId = uuid.replace(/-/g, "").substring(0, 8);

    const { data, error } = await supabase
      .from("short_links")
      .insert({
        workspace_id: params.workspaceId || null,
        short_id: shortId,
        original_url: params.originalUrl,
        query_string: params.queryString,
        expires_at: params.expiresAt?.toISOString() || null,
        created_by: null, // Service Role이므로 created_by는 null
      })
      .select("short_id")
      .single();

    if (error) {
      console.error("[ShortLink] 생성 실패:", error);
      return { success: false, error: error.message };
    }

    const shortUrl = createShortUrl(data.short_id);
    return { success: true, shortId: data.short_id, shortUrl };
  } catch (error) {
    console.error("[ShortLink] 예상치 못한 에러:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * short_id로 원본 쿼리 스트링 조회
 */
export async function getShortLink(
  shortId: string
): Promise<{ success: true; queryString: string; originalUrl: string } | { success: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("short_links")
      .select("query_string, original_url, expires_at, access_count")
      .eq("short_id", shortId)
      .single();

    if (error) {
      console.error("[ShortLink] 조회 실패:", error);
      return { success: false, error: error.message };
    }

    // 만료 확인
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        return { success: false, error: "링크가 만료되었습니다." };
      }
    }

    // 접근 횟수 업데이트
    await supabase
      .from("short_links")
      .update({
        access_count: (data.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("short_id", shortId);

    return {
      success: true,
      queryString: data.query_string,
      originalUrl: data.original_url,
    };
  } catch (error) {
    console.error("[ShortLink] 예상치 못한 에러:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * URL이 길어질 경우 축약 여부 판단 (쿼리 스트링 길이 기준)
 */
export function shouldShortenUrl(queryString: string, threshold: number = 2000): boolean {
  return queryString.length > threshold;
}
