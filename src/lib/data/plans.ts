import { createClient } from "@/lib/supabase/server";

// 간소화된 타입 정의
export interface Plan {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInsert {
  workspace_id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  priority?: number;
  created_by?: string | null;
}

export interface PlanAssignee {
  id: string;
  plan_id: string;
  user_id: string;
  created_at: string;
}

export interface PlanWithAssignees extends Plan {
  assignees: PlanAssignee[];
}

/**
 * 기간 내 일정 조회
 */
export async function getPlansByDateRange(
  workspaceId: string,
  startDate: string,
  endDate: string
): Promise<PlanWithAssignees[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*, assignees:plan_assignees(*)")
    .eq("workspace_id", workspaceId)
    .gte("end_date", startDate)
    .lte("start_date", endDate)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }

  return (data || []) as PlanWithAssignees[];
}

/**
 * 모든 일정 조회
 */
export async function getAllPlans(
  workspaceId: string
): Promise<PlanWithAssignees[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*, assignees:plan_assignees(*)")
    .eq("workspace_id", workspaceId)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching all plans:", error);
    throw error;
  }

  return (data || []) as PlanWithAssignees[];
}

/**
 * 일정 생성
 */
export async function createPlan(
  plan: PlanInsert,
  assigneeUserIds: string[]
): Promise<PlanWithAssignees> {
  const supabase = await createClient();

  // 일정 생성
  const { data: createdPlan, error: planError } = await supabase
    .from("plans")
    .insert(plan)
    .select()
    .single();

  if (planError) {
    console.error("Error creating plan:", planError);
    throw planError;
  }

  // 담당자 연결
  if (assigneeUserIds.length > 0) {
    const assignees = assigneeUserIds.map((userId) => ({
      plan_id: createdPlan.id,
      user_id: userId,
    }));

    const { error: assigneesError } = await supabase
      .from("plan_assignees")
      .insert(assignees);

    if (assigneesError) {
      console.error("Error creating assignees:", assigneesError);
      throw assigneesError;
    }
  }

  // 다시 조회하여 assignees 포함
  const { data, error } = await supabase
    .from("plans")
    .select("*, assignees:plan_assignees(*)")
    .eq("id", createdPlan.id)
    .single();

  if (error) {
    throw error;
  }

  return data as PlanWithAssignees;
}

/**
 * 일정 업데이트
 */
export async function updatePlan(
  planId: string,
  updates: Partial<PlanInsert>,
  assigneeUserIds?: string[]
): Promise<PlanWithAssignees> {
  const supabase = await createClient();

  // 일정 업데이트
  const { error: planError } = await supabase
    .from("plans")
    .update(updates)
    .eq("id", planId);

  if (planError) {
    console.error("Error updating plan:", planError);
    throw planError;
  }

  // 담당자 업데이트 (전체 교체)
  if (assigneeUserIds !== undefined) {
    // 기존 담당자 삭제
    const { error: deleteError } = await supabase
      .from("plan_assignees")
      .delete()
      .eq("plan_id", planId);

    if (deleteError) {
      console.error("Error deleting assignees:", deleteError);
      throw deleteError;
    }

    // 새 담당자 추가
    if (assigneeUserIds.length > 0) {
      const assignees = assigneeUserIds.map((userId) => ({
        plan_id: planId,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from("plan_assignees")
        .insert(assignees);

      if (insertError) {
        console.error("Error inserting assignees:", insertError);
        throw insertError;
      }
    }
  }

  // 다시 조회
  const { data, error } = await supabase
    .from("plans")
    .select("*, assignees:plan_assignees(*)")
    .eq("id", planId)
    .single();

  if (error) {
    throw error;
  }

  return data as PlanWithAssignees;
}

/**
 * 일정 삭제
 */
export async function deletePlan(planId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("plans").delete().eq("id", planId);

  if (error) {
    console.error("Error deleting plan:", error);
    throw error;
  }
}

