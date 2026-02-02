"use server";

/**
 * ShortLink Server Actions
 *
 * 클라이언트에서 안전하게 호출할 수 있는 Short Link 서버 액션
 * Supabase Service Role은 서버에서만 접근 가능하므로 Server Action으로 래핑
 */

import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

interface CreateShortLinkParams {
  workspaceId?: string;
  originalUrl: string;
  queryString: string;
  expiresAt?: string; // ISO date string (Date는 Server Action으로 전달 불가)
}

interface CreateShortLinkResult {
  success: true;
  shortId: string;
  shortUrl: string;
}

interface CreateShortLinkError {
  success: false;
  error: string;
}

/**
 * Short Link 생성 Server Action
 */
export async function createShortLinkAction(
  params: CreateShortLinkParams
): Promise<CreateShortLinkResult | CreateShortLinkError> {
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
        expires_at: params.expiresAt || null,
        created_by: null, // Service Role이므로 created_by는 null
      })
      .select("short_id")
      .single();

    if (error) {
      console.error("[ShortLink] 생성 실패:", error);
      return { success: false, error: error.message };
    }

    // shortUrl 생성 (서버에서는 origin을 알 수 없으므로 상대 경로만 반환)
    const shortUrl = `/s/${data.short_id}`;
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
 * Short Link 조회 Server Action
 */
export async function getShortLinkAction(
  shortId: string
): Promise<
  | { success: true; queryString: string; originalUrl: string }
  | { success: false; error: string }
> {
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
