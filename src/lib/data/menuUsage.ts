/**
 * Menu/Page usage analytics data layer
 * 
 * Reads from 3 DB views:
 * - v_menu_usage_weekly
 * - v_page_usage_weekly  
 * - v_user_menu_usage_weekly
 */

import { createClient } from "@/lib/supabase/server";

export interface MenuUsageWeekly {
  week_start_seoul: string;
  menu_group: string | null;
  menu_key: string | null;
  event_type: string;
  event_count: number;
  unique_users: number;
}

export interface PageUsageWeekly {
  week_start_seoul: string;
  page_path: string;
  event_count: number;
  unique_users: number;
}

export interface UserMenuUsageWeekly {
  week_start_seoul: string;
  user_id: string;
  display_name: string | null;
  menu_key: string | null;
  event_count: number;
}

/**
 * Get menu usage (grouped by menu_group/menu_key/event_type)
 */
export async function getMenuUsageWeekly(params: {
  workspaceId: string;
  weeksLimit?: number;
  menuGroup?: string;
  eventType?: string;
}): Promise<MenuUsageWeekly[]> {
  const { workspaceId, weeksLimit = 8, menuGroup, eventType } = params;

  const supabase = await createClient();

  let query = supabase
    .from("v_menu_usage_weekly")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("week_start_seoul", { ascending: false })
    .limit(weeksLimit * 20); // Rough estimate

  // Optional filters
  if (menuGroup) {
    query = query.eq("menu_group", menuGroup);
  }
  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[menuUsage] Error fetching menu usage weekly:", error);
    return [];
  }

  return (data || []) as MenuUsageWeekly[];
}

/**
 * Get page usage (grouped by page_path)
 */
export async function getPageUsageWeekly(params: {
  workspaceId: string;
  weeksLimit?: number;
}): Promise<PageUsageWeekly[]> {
  const { workspaceId, weeksLimit = 8 } = params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_page_usage_weekly")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("week_start_seoul", { ascending: false })
    .limit(weeksLimit * 50); // Rough estimate

  if (error) {
    console.error("[menuUsage] Error fetching page usage weekly:", error);
    return [];
  }

  return (data || []) as PageUsageWeekly[];
}

/**
 * Get user menu usage (grouped by user + menu_key)
 */
export async function getUserMenuUsageWeekly(params: {
  workspaceId: string;
  weeksLimit?: number;
}): Promise<UserMenuUsageWeekly[]> {
  const { workspaceId, weeksLimit = 8 } = params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_user_menu_usage_weekly")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("week_start_seoul", { ascending: false })
    .limit(weeksLimit * 100); // Rough estimate

  if (error) {
    console.error("[menuUsage] Error fetching user menu usage weekly:", error);
    return [];
  }

  return (data || []) as UserMenuUsageWeekly[];
}

