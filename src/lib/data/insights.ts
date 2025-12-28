/**
 * Admin Insights 데이터 레이어
 * 
 * DB 뷰를 사용한 Insights 조회
 */

import { createClient } from "@/lib/supabase/server";

export interface FlagPlanSummary {
  flag_title: string;
  flag_start_date: string;
  flag_end_date: string;
  days: number;
  plan_count: number;
}

export interface ResourceDistribution {
  display_name: string;
  assigned_plan_count: number;
}

export interface CollabEdge {
  from_user: string;
  to_user: string;
  collaboration_count: number;
}

/**
 * v_flag_plan_summary 조회
 */
export async function getFlagPlanSummary(
  workspaceId: string
): Promise<{ data: FlagPlanSummary[]; error?: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("v_flag_plan_summary")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("flag_start_date", { ascending: false });
  
  if (error) {
    console.error("[getFlagPlanSummary] Error:", error);
    return { data: [], error: error.message };
  }
  
  return { data: data || [] };
}

/**
 * v_resource_distribution 조회
 */
export async function getResourceDistribution(
  workspaceId: string
): Promise<{ data: ResourceDistribution[]; error?: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("v_resource_distribution")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("assigned_plan_count", { ascending: false });
  
  if (error) {
    console.error("[getResourceDistribution] Error:", error);
    return { data: [], error: error.message };
  }
  
  return { data: data || [] };
}

/**
 * v_collab_edges 조회
 */
export async function getCollabEdges(
  workspaceId: string
): Promise<{ data: CollabEdge[]; error?: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("v_collab_edges")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("collaboration_count", { ascending: false });
  
  if (error) {
    console.error("[getCollabEdges] Error:", error);
    return { data: [], error: error.message };
  }
  
  return { data: data || [] };
}

