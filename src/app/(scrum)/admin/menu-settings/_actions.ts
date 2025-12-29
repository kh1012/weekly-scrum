"use server";

import {
  getMenuSettings,
  upsertMenuSetting,
  bulkUpsertMenuSettings,
  deleteMenuSetting,
  type MenuSetting,
  type MenuSettingInput,
} from "@/lib/data/menuSettings";

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

