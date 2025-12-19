/**
 * Profiles 데이터 조회
 */

import { createClient } from "@/lib/supabase/server";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 워크스페이스 멤버들의 display_name 목록 조회
 */
export async function getMemberNames(): Promise<string[]> {
  const supabase = await createClient();

  // 워크스페이스 멤버 조회
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID);

  if (!members || members.length === 0) {
    return [];
  }

  // profiles에서 display_name 조회
  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("display_name")
    .in("user_id", userIds)
    .order("display_name");

  if (!profiles) {
    return [];
  }

  // display_name만 추출하여 반환
  return profiles
    .map((p) => p.display_name)
    .filter((name): name is string => !!name);
}

