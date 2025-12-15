"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import {
  createPlan as createPlanData,
  updatePlan as updatePlanData,
  deletePlan as deletePlanData,
  type CreatePlanPayload,
  type PlanType,
  type PlanStatus,
} from "@/lib/data/plans";
import { replaceAssignees, type AssigneeInput } from "@/lib/data/planAssignees";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

/**
 * Plan 생성 입력 타입
 */
export interface CreatePlanActionInput {
  type: PlanType;
  title: string;
  stage: string;
  status?: PlanStatus;
  domain?: string;
  project?: string;
  module?: string;
  feature?: string;
  start_date?: string;
  end_date?: string;
  assignees?: AssigneeInput[];
}

/**
 * Plan 수정 입력 타입
 */
export interface UpdatePlanActionInput extends Partial<CreatePlanActionInput> {
  id: string;
}

/**
 * 액션 결과 타입
 */
interface ActionResult {
  success: boolean;
  error?: string;
  planId?: string;
}

/**
 * Plan 생성 서버 액션 (관리자 전용)
 * - admin/leader 권한 검증
 * - created_by/updated_by 자동 세팅
 */
export async function createPlanAction(
  input: CreatePlanActionInput
): Promise<ActionResult> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 생성할 수 있습니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // feature type 검증
    if (input.type === "feature") {
      if (!input.domain || !input.project || !input.module || !input.feature) {
        return {
          success: false,
          error: "feature 타입 계획은 domain, project, module, feature가 모두 필수입니다.",
        };
      }
    }

    // 날짜 검증
    if (input.start_date && input.end_date) {
      if (new Date(input.end_date) < new Date(input.start_date)) {
        return { success: false, error: "종료일은 시작일보다 이후여야 합니다." };
      }
    }

    // Plan 생성
    const payload: CreatePlanPayload = {
      type: input.type,
      title: input.title,
      stage: input.stage,
      status: input.status,
      domain: input.domain || null,
      project: input.project || null,
      module: input.module || null,
      feature: input.feature || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
    };

    const plan = await createPlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      payload,
      createdBy: user.id,
    });

    // 담당자 할당
    if (input.assignees && input.assignees.length > 0) {
      await replaceAssignees({
        workspaceId: DEFAULT_WORKSPACE_ID,
        planId: plan.id,
        assignees: input.assignees,
      });
    }

    revalidatePath("/admin/plans");
    revalidatePath("/plans");

    return { success: true, planId: plan.id };
  } catch (err) {
    console.error("[createPlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "생성에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * Plan 수정 서버 액션 (관리자 전용)
 * - admin/leader 권한 검증
 * - updated_by 자동 세팅
 */
export async function updatePlanAction(
  input: UpdatePlanActionInput
): Promise<ActionResult> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 수정할 수 있습니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // feature type 검증
    if (input.type === "feature") {
      if (!input.domain || !input.project || !input.module || !input.feature) {
        return {
          success: false,
          error: "feature 타입 계획은 domain, project, module, feature가 모두 필수입니다.",
        };
      }
    }

    // 날짜 검증
    if (input.start_date && input.end_date) {
      if (new Date(input.end_date) < new Date(input.start_date)) {
        return { success: false, error: "종료일은 시작일보다 이후여야 합니다." };
      }
    }

    // Plan 수정
    const { id, assignees, ...updatePayload } = input;
    await updatePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId: id,
      payload: updatePayload,
      updatedBy: user.id,
    });

    // 담당자 업데이트
    if (assignees !== undefined) {
      await replaceAssignees({
        workspaceId: DEFAULT_WORKSPACE_ID,
        planId: id,
        assignees: assignees,
      });
    }

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${id}`);
    revalidatePath("/plans");

    return { success: true, planId: id };
  } catch (err) {
    console.error("[updatePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "수정에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * Plan 삭제 서버 액션 (관리자 전용)
 * - admin/leader 권한 검증
 * - plan_assignees는 FK cascade로 자동 삭제
 */
export async function deletePlanAction(planId: string): Promise<ActionResult> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 삭제할 수 있습니다." };
    }

    await deletePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId,
    });

    revalidatePath("/admin/plans");
    revalidatePath("/plans");

    return { success: true };
  } catch (err) {
    console.error("[deletePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * Plan 상태 빠른 변경 (관리자 전용)
 */
export async function updatePlanStatusAction(
  planId: string,
  status: PlanStatus
): Promise<ActionResult> {
  try {
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    await updatePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId,
      payload: { status },
      updatedBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    revalidatePath("/plans");

    return { success: true };
  } catch (err) {
    console.error("[updatePlanStatusAction] Error:", err);
    const message = err instanceof Error ? err.message : "상태 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}
