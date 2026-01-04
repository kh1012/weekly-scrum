/**
 * 인증 관련 헬퍼 함수 (서버 전용)
 * - 서버 컴포넌트, 서버 액션, API 라우트에서만 사용
 */

import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * 서버 사이드에서 현재 사용자 가져오기
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

