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

    // feature type 검증 (domain은 선택사항으로 변경)
    if (input.type === "feature") {
      if (!input.project || !input.module || !input.feature) {
        return {
          success: false,
          error: "feature 타입 계획은 project, module, feature가 모두 필수입니다.",
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

    // feature type 검증 (domain은 선택사항으로 변경)
    if (input.type === "feature") {
      if (!input.project || !input.module || !input.feature) {
        return {
          success: false,
          error: "feature 타입 계획은 project, module, feature가 모두 필수입니다.",
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
 * Plan 제목 빠른 변경 (관리자 전용) - 인라인 편집용
 */
export async function updatePlanTitleAction(
  planId: string,
  title: string
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

    if (!title.trim()) {
      return { success: false, error: "제목은 비워둘 수 없습니다." };
    }

    await updatePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId,
      payload: { title: title.trim() },
      updatedBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    revalidatePath("/plans");

    return { success: true };
  } catch (err) {
    console.error("[updatePlanTitleAction] Error:", err);
    const message = err instanceof Error ? err.message : "제목 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * Plan 날짜 이동 (관리자 전용) - 드래그 이동용
 */
export async function movePlanAction(
  planId: string,
  startDate: string,
  endDate: string
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

    // 날짜 검증
    if (new Date(endDate) < new Date(startDate)) {
      return { success: false, error: "종료일은 시작일보다 이후여야 합니다." };
    }

    await updatePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId,
      payload: {
        start_date: startDate,
        end_date: endDate,
      },
      updatedBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    revalidatePath("/plans");

    return { success: true, planId };
  } catch (err) {
    console.error("[movePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "이동에 실패했습니다.";
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

/**
 * Plan Stage 빠른 변경 (관리자 전용)
 */
export async function updatePlanStageAction(
  planId: string,
  stage: string
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
      payload: { stage },
      updatedBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    revalidatePath("/plans");

    return { success: true };
  } catch (err) {
    console.error("[updatePlanStageAction] Error:", err);
    const message = err instanceof Error ? err.message : "스테이지 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * Plan 복제 (관리자 전용) - Cmd/Ctrl + D
 * - 원본 Plan의 모든 속성 복사
 * - 날짜는 다음 주로 이동
 * - 제목에 "(copy)" 접미사 추가
 */
export async function duplicatePlanAction(
  planId: string
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

    // 원본 Plan 조회
    const { data: originalPlan, error: fetchError } = await supabase
      .from("v_plans_with_assignees")
      .select("*")
      .eq("id", planId)
      .single();

    if (fetchError || !originalPlan) {
      return { success: false, error: "원본 계획을 찾을 수 없습니다." };
    }

    // 날짜 계산 (1주일 뒤로 이동)
    let newStartDate: string | null = null;
    let newEndDate: string | null = null;
    
    if (originalPlan.start_date && originalPlan.end_date) {
      const startDate = new Date(originalPlan.start_date);
      const endDate = new Date(originalPlan.end_date);
      startDate.setDate(startDate.getDate() + 7);
      endDate.setDate(endDate.getDate() + 7);
      newStartDate = startDate.toISOString().split("T")[0];
      newEndDate = endDate.toISOString().split("T")[0];
    }

    // 새 Plan 생성
    const payload: CreatePlanPayload = {
      type: originalPlan.type as PlanType,
      title: `${originalPlan.title} (copy)`,
      stage: originalPlan.stage,
      status: originalPlan.status as PlanStatus,
      domain: originalPlan.domain,
      project: originalPlan.project,
      module: originalPlan.module,
      feature: originalPlan.feature,
      start_date: newStartDate,
      end_date: newEndDate,
    };

    const newPlan = await createPlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      payload,
      createdBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath("/plans");

    return { success: true, planId: newPlan.id };
  } catch (err) {
    console.error("[duplicatePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "복제에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * 간트 셀 클릭으로 Draft Plan 생성 (관리자 전용)
 * - type='feature'
 * - title='새 계획'
 * - stage='컨셉 기획'
 * - start_date=클릭한 날짜, end_date=start_date+1일
 */
export interface CreateDraftAtCellInput {
  project: string;
  module: string;
  feature: string;
  date: string; // YYYY-MM-DD
}

export async function createDraftPlanAtCellAction(
  input: CreateDraftAtCellInput
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

    // 시작일 기준으로 종료일 계산 (시작일 + 1일)
    const startDate = new Date(input.date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const payload: CreatePlanPayload = {
      type: "feature" as PlanType,
      title: "새 계획",
      stage: "컨셉 기획",
      status: "진행중" as PlanStatus,
      domain: null, // domain은 더 이상 사용하지 않음
      project: input.project,
      module: input.module,
      feature: input.feature,
      start_date: input.date,
      end_date: endDate.toISOString().split("T")[0],
    };

    const plan = await createPlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      payload,
      createdBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath("/plans");

    return { success: true, planId: plan.id };
  } catch (err) {
    console.error("[createDraftPlanAtCellAction] Error:", err);
    const message = err instanceof Error ? err.message : "생성에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * 간트 셀에서 Quick Create (관리자 전용) - Airbnb 스타일
 * - title 입력으로 빠른 Plan 생성
 */
export interface QuickCreatePlanInput {
  title: string;
  project: string;
  module: string;
  feature: string;
  date: string; // YYYY-MM-DD (시작일)
}

export async function quickCreatePlanAction(
  input: QuickCreatePlanInput
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

    // 시작일 기준으로 종료일 계산 (시작일 + 6일 = 1주일)
    const startDate = new Date(input.date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const payload: CreatePlanPayload = {
      type: "feature" as PlanType,
      title: input.title,
      stage: "컨셉 기획",
      status: "진행중" as PlanStatus,
      domain: null, // domain은 더 이상 사용하지 않음
      project: input.project,
      module: input.module,
      feature: input.feature,
      start_date: input.date,
      end_date: endDate.toISOString().split("T")[0],
    };

    const plan = await createPlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      payload,
      createdBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath("/plans");

    return { success: true, planId: plan.id };
  } catch (err) {
    console.error("[quickCreatePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "생성에 실패했습니다.";
    return { success: false, error: message };
  }
}

/**
 * 간트 막대 리사이즈 (관리자 전용)
 * - start_date 또는 end_date 변경
 */
export interface ResizePlanInput {
  planId: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export async function resizePlanAction(
  input: ResizePlanInput
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

    // 날짜 검증
    if (new Date(input.end_date) < new Date(input.start_date)) {
      return { success: false, error: "종료일은 시작일보다 이후여야 합니다." };
    }

    await updatePlanData({
      workspaceId: DEFAULT_WORKSPACE_ID,
      planId: input.planId,
      payload: {
        start_date: input.start_date,
        end_date: input.end_date,
      },
      updatedBy: user.id,
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${input.planId}`);
    revalidatePath("/plans");

    return { success: true, planId: input.planId };
  } catch (err) {
    console.error("[resizePlanAction] Error:", err);
    const message = err instanceof Error ? err.message : "기간 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}
