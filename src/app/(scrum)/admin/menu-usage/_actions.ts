"use server";

/**
 * Server actions for menu usage debugging
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

/**
 * Get recent menu events for debugging
 */
export async function getRecentMenuEvents() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get workspace_id from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile?.workspace_id) {
    return { success: false, error: "No workspace found" };
  }

  // Get recent menu events
  const { data, error } = await supabase
    .from("menu_events")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Debug] Error fetching menu events:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get view data for debugging
 */
export async function getViewData() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get workspace_id from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile?.workspace_id) {
    return { success: false, error: "No workspace found" };
  }

  // Get data from all views
  const [menuUsage, pageUsage, userMenuUsage] = await Promise.all([
    supabase
      .from("v_menu_usage_weekly")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("week_start_seoul", { ascending: false })
      .limit(10),
    supabase
      .from("v_page_usage_weekly")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("week_start_seoul", { ascending: false })
      .limit(10),
    supabase
      .from("v_user_menu_usage_weekly")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("week_start_seoul", { ascending: false })
      .limit(10),
  ]);

  return {
    success: true,
    menuUsage: menuUsage.data || [],
    pageUsage: pageUsage.data || [],
    userMenuUsage: userMenuUsage.data || [],
    errors: {
      menuUsage: menuUsage.error?.message,
      pageUsage: pageUsage.error?.message,
      userMenuUsage: userMenuUsage.error?.message,
    },
  };
}

/**
 * Test current user session
 */
export async function testCurrentUser() {
  const supabase = await createClient();

  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    return {
      success: false,
      error: error?.message || "No user",
    };
  }

  return {
    success: true,
    user: {
      id: userData.user.id,
      email: userData.user.email,
    },
  };
}

