/**
 * SNB 메뉴 설정 관리
 * workspace별로 각 메뉴의 노출 여부와 태그를 관리
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Service role client (bypasses RLS)
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type TagColor = "blue" | "green" | "orange" | "pink" | "purple" | "gray";

export interface MenuSetting {
  id: string;
  workspace_id: string;
  menu_key: string;
  is_enabled: boolean;
  tag_label: string | null;
  tag_color: TagColor | null;
  created_at: string;
  updated_at: string;
}

export interface MenuSettingInput {
  menu_key: string;
  is_enabled: boolean;
  tag_label?: string | null;
  tag_color?: TagColor | null;
}

/**
 * workspace의 모든 메뉴 설정 조회
 */
export async function getMenuSettings(
  workspaceId: string
): Promise<MenuSetting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("menu_key");

  if (error) {
    console.error("[getMenuSettings] Error:", error);
    throw new Error(`Failed to fetch menu settings: ${error.message}`);
  }

  return data || [];
}

/**
 * 특정 메뉴 설정 조회
 */
export async function getMenuSetting(
  workspaceId: string,
  menuKey: string
): Promise<MenuSetting | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("menu_key", menuKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("[getMenuSetting] Error:", error);
    throw new Error(`Failed to fetch menu setting: ${error.message}`);
  }

  return data;
}

/**
 * 메뉴 설정 생성 또는 업데이트 (upsert)
 */
export async function upsertMenuSetting(
  workspaceId: string,
  input: MenuSettingInput
): Promise<MenuSetting> {
  // Service role client를 사용하여 RLS 우회
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("menu_settings")
    .upsert(
      {
        workspace_id: workspaceId,
        menu_key: input.menu_key,
        is_enabled: input.is_enabled,
        tag_label: input.tag_label || null,
        tag_color: input.tag_color || null,
      },
      {
        onConflict: "workspace_id,menu_key",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[upsertMenuSetting] Error:", error);
    throw new Error(`Failed to upsert menu setting: ${error.message}`);
  }

  return data;
}

/**
 * 여러 메뉴 설정을 한 번에 업데이트
 */
export async function bulkUpsertMenuSettings(
  workspaceId: string,
  inputs: MenuSettingInput[]
): Promise<MenuSetting[]> {
  const supabase = createServiceRoleClient();

  const records = inputs.map((input) => ({
    workspace_id: workspaceId,
    menu_key: input.menu_key,
    is_enabled: input.is_enabled,
    tag_label: input.tag_label || null,
    tag_color: input.tag_color || null,
  }));

  const { data, error } = await supabase
    .from("menu_settings")
    .upsert(records, {
      onConflict: "workspace_id,menu_key",
    })
    .select();

  if (error) {
    console.error("[bulkUpsertMenuSettings] Error:", error);
    throw new Error(`Failed to bulk upsert menu settings: ${error.message}`);
  }

  return data || [];
}

/**
 * 메뉴 설정 삭제 (기본값으로 되돌리기)
 */
export async function deleteMenuSetting(
  workspaceId: string,
  menuKey: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("menu_settings")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("menu_key", menuKey);

  if (error) {
    console.error("[deleteMenuSetting] Error:", error);
    throw new Error(`Failed to delete menu setting: ${error.message}`);
  }
}

/**
 * workspace의 메뉴 설정을 Map으로 변환 (빠른 조회용)
 */
export async function getMenuSettingsMap(
  workspaceId: string
): Promise<Map<string, MenuSetting>> {
  const settings = await getMenuSettings(workspaceId);
  return new Map(settings.map((s) => [s.menu_key, s]));
}

