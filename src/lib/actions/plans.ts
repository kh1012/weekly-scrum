"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminOrOwner } from "@/lib/auth/getWorkspaceRole";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export interface CreatePlanInput {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  priority?: number;
  assignee_ids?: string[];
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  id: string;
}

/**
 * Plan 생성 (관리자 전용)
 */
export async function createPlan(input: CreatePlanInput): Promise<{
  success: boolean;
  planId?: string;
  error?: string;
}> {
  // 권한 확인
  const hasAccess = await isAdminOrOwner();
  if (!hasAccess) {
    return { success: false, error: "권한이 없습니다." };
  }

  const supabase = await createClient();

  // 현재 유저 정보
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // Plan 생성
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      workspace_id: DEFAULT_WORKSPACE_ID,
      title: input.title,
      description: input.description || null,
      start_date: input.start_date,
      end_date: input.end_date,
      status: input.status || "planned",
      priority: input.priority || 1,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (planError) {
    console.error("[createPlan] Failed:", planError);
    return { success: false, error: planError.message };
  }

  // 담당자 할당
  if (input.assignee_ids && input.assignee_ids.length > 0) {
    const assignees = input.assignee_ids.map((userId) => ({
      plan_id: plan.id,
      user_id: userId,
    }));

    const { error: assignError } = await supabase
      .from("plan_assignees")
      .insert(assignees);

    if (assignError) {
      console.error("[createPlan] Failed to assign:", assignError);
      // 담당자 할당 실패해도 plan 생성은 성공
    }
  }

  revalidatePath("/admin/plans");
  return { success: true, planId: plan.id };
}

/**
 * Plan 수정 (관리자 전용)
 */
export async function updatePlan(input: UpdatePlanInput): Promise<{
  success: boolean;
  error?: string;
}> {
  // 권한 확인
  const hasAccess = await isAdminOrOwner();
  if (!hasAccess) {
    return { success: false, error: "권한이 없습니다." };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, assignee_ids, ...updateData } = input;

  // Plan 업데이트
  const { error: updateError } = await supabase
    .from("plans")
    .update(updateData)
    .eq("id", id);

  if (updateError) {
    console.error("[updatePlan] Failed:", updateError);
    return { success: false, error: updateError.message };
  }

  // 담당자 업데이트 (전체 교체)
  if (assignee_ids !== undefined) {
    // 기존 담당자 삭제
    await supabase.from("plan_assignees").delete().eq("plan_id", id);

    // 새 담당자 할당
    if (assignee_ids.length > 0) {
      const assignees = assignee_ids.map((userId) => ({
        plan_id: id,
        user_id: userId,
      }));

      const { error: assignError } = await supabase
        .from("plan_assignees")
        .insert(assignees);

      if (assignError) {
        console.error("[updatePlan] Failed to assign:", assignError);
      }
    }
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  return { success: true };
}

/**
 * Plan 삭제 (관리자 전용)
 */
export async function deletePlan(planId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 권한 확인
  const hasAccess = await isAdminOrOwner();
  if (!hasAccess) {
    return { success: false, error: "권한이 없습니다." };
  }

  const supabase = await createClient();

  // 담당자 먼저 삭제 (FK 제약)
  await supabase.from("plan_assignees").delete().eq("plan_id", planId);

  // Plan 삭제
  const { error } = await supabase.from("plans").delete().eq("id", planId);

  if (error) {
    console.error("[deletePlan] Failed:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/plans");
  return { success: true };
}

