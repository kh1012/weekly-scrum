"use server";

import {
  getMenuSettings,
  upsertMenuSetting,
  bulkUpsertMenuSettings,
  deleteMenuSetting,
  type MenuSetting,
  type MenuSettingInput,
} from "@/lib/data/menu";
import { getMenuUsageWeekly } from "@/lib/data/menu";

export async function getMenuSettingsAction(
  workspaceId: string
): Promise<{ success: true; data: MenuSetting[] } | { success: false; error: string }> {
  try {
    const data = await getMenuSettings(workspaceId);
    return { success: true, data };
  } catch (error) {
    console.error("[getMenuSettingsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function upsertMenuSettingAction(
  workspaceId: string,
  input: MenuSettingInput
): Promise<{ success: true; data: MenuSetting } | { success: false; error: string }> {
  try {
    const data = await upsertMenuSetting(workspaceId, input);
    return { success: true, data };
  } catch (error) {
    console.error("[upsertMenuSettingAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function bulkUpsertMenuSettingsAction(
  workspaceId: string,
  inputs: MenuSettingInput[]
): Promise<{ success: true; data: MenuSetting[] } | { success: false; error: string }> {
  try {
    const data = await bulkUpsertMenuSettings(workspaceId, inputs);
    return { success: true, data };
  } catch (error) {
    console.error("[bulkUpsertMenuSettingsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteMenuSettingAction(
  workspaceId: string,
  menuKey: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await deleteMenuSetting(workspaceId, menuKey);
    return { success: true };
  } catch (error) {
    console.error("[deleteMenuSettingAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 여러 메뉴 설정을 한 번에 삭제 (전체 초기화용)
 */
export async function bulkDeleteMenuSettingsAction(
  workspaceId: string,
  menuKeys: string[]
): Promise<{ success: true; deletedCount: number } | { success: false; error: string }> {
  try {
    // Service role client를 사용하여 RLS 우회
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase service role credentials");
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 일괄 삭제 (IN 절 사용)
    const { error, count } = await supabase
      .from("menu_settings")
      .delete({ count: "exact" })
      .eq("workspace_id", workspaceId)
      .in("menu_key", menuKeys);

    if (error) {
      console.error("[bulkDeleteMenuSettingsAction] Error:", error);
      throw new Error(`Failed to bulk delete menu settings: ${error.message}`);
    }

    return { success: true, deletedCount: count || 0 };
  } catch (error) {
    console.error("[bulkDeleteMenuSettingsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * PAGE_VIEW 기준으로 메뉴 사용량 데이터 조회
 * menu_group과 menu_key를 함께 고려하여 집계
 */
export async function getMenuUsageForTaggingAction(
  workspaceId: string,
  weeksLimit: number = 8
): Promise<
  | { success: true; data: Array<{ menu_key: string; menu_group: string | null; total_count: number }> }
  | { success: false; error: string }
> {
  try {
    const menuUsage = await getMenuUsageWeekly({
      workspaceId,
      weeksLimit,
      eventType: "PAGE_VIEW",
    });

    // menu_group + menu_key 조합으로 집계 (같은 menu_key라도 다른 group이면 다른 메뉴)
    const aggregated = new Map<string, { menu_key: string; menu_group: string | null; total_count: number }>();
    
    for (const record of menuUsage) {
      if (record.menu_key) {
        const key = `${record.menu_group || 'null'}:${record.menu_key}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.total_count += record.event_count;
        } else {
          aggregated.set(key, {
            menu_key: record.menu_key,
            menu_group: record.menu_group,
            total_count: record.event_count,
          });
        }
      }
    }

    const result = Array.from(aggregated.values())
      .sort((a, b) => b.total_count - a.total_count);

    return { success: true, data: result };
  } catch (error) {
    console.error("[getMenuUsageForTaggingAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

