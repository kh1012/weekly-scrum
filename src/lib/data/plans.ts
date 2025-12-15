import { createClient } from "@/lib/supabase/server";

/**
 * Plan 타입 (DB plan_type enum)
 * - feature: 기능 개발 계획 (domain/project/module/feature 필수)
 * - event: 이벤트성 계획 (릴리즈/배포 등, title만 필수)
 */
export type PlanType = "feature" | "event";

/**
 * Plan 상태
 */
export type PlanStatus = "진행중" | "완료" | "보류" | "취소";

/**
 * 담당자 역할 (DB assignee_role enum)
 */
export type AssigneeRole = "owner" | "developer" | "reviewer" | "stakeholder";

/**
 * Plan 기본 타입 (DB 스키마 기반)
 */
export interface Plan {
  id: string;
  workspace_id: string;
  type: PlanType;
  domain: string | null;
  project: string | null;
  module: string | null;
  feature: string | null;
  title: string;
  stage: string;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Plan Assignee 타입
 */
export interface PlanAssignee {
  plan_id: string;
  workspace_id: string;
  user_id: string;
  role: AssigneeRole;
  // JOIN된 프로필 정보
  profiles?: {
    display_name: string | null;
    email: string | null;
  };
}

/**
 * Plan with Assignees (조회용)
 */
export interface PlanWithAssignees extends Plan {
  assignees: PlanAssignee[];
  // 생성자 프로필
  creator?: {
    display_name: string | null;
    email: string | null;
  };
}

/**
 * Plan 생성 입력
 */
export interface CreatePlanPayload {
  type: PlanType;
  title: string;
  stage: string;
  status?: PlanStatus;
  domain?: string | null;
  project?: string | null;
  module?: string | null;
  feature?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Plan 수정 입력
 */
export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {
  id: string;
}

/**
 * 필터 옵션
 */
export interface PlanFilters {
  type?: PlanType;
  domain?: string;
  project?: string;
  module?: string;
  feature?: string;
  status?: PlanStatus;
  stage?: string;
  assigneeUserId?: string;
}

/**
 * 월 범위 기반 Plans 조회
 * - 해당 월과 겹치는(overlap) 계획을 조회
 * - start_date <= monthEnd AND (end_date is null OR end_date >= monthStart)
 * - idx_plans_workspace_dates 인덱스 활용
 */
export async function listPlansForMonth({
  workspaceId,
  monthStart,
  monthEnd,
  filters,
}: {
  workspaceId: string;
  monthStart: string; // YYYY-MM-DD
  monthEnd: string; // YYYY-MM-DD
  filters?: PlanFilters;
}): Promise<PlanWithAssignees[]> {
  const supabase = await createClient();

  try {
    // 기본 쿼리 구성 (FK 조인 없이 안전하게)
    let query = supabase
      .from("plans")
      .select(
        `
        *,
        plan_assignees (
          plan_id,
          workspace_id,
          user_id,
          role
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("start_date", { ascending: true, nullsFirst: false });

    // 월 범위 필터 (overlap 조건)
    // 일정이 해당 월에 걸쳐있는 경우
    query = query
      .or(`start_date.is.null,start_date.lte.${monthEnd}`)
      .or(`end_date.is.null,end_date.gte.${monthStart}`);

    // 추가 필터 적용
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.domain) {
      query = query.eq("domain", filters.domain);
    }
    if (filters?.project) {
      query = query.eq("project", filters.project);
    }
    if (filters?.module) {
      query = query.eq("module", filters.module);
    }
    if (filters?.feature) {
      query = query.eq("feature", filters.feature);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.stage) {
      query = query.eq("stage", filters.stage);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[listPlansForMonth] Failed:", error);
      // 테이블이 없거나 스키마 문제일 경우 빈 배열 반환
      return [];
    }

    // assignee 필터는 클라이언트 측에서 처리 (복잡한 JOIN 대신)
    let plans = (data || []) as PlanWithAssignees[];

    if (filters?.assigneeUserId) {
      plans = plans.filter((plan) =>
        plan.assignees?.some((a) => a.user_id === filters.assigneeUserId)
      );
    }

    return plans;
  } catch (err) {
    console.error("[listPlansForMonth] Unexpected error:", err);
    return [];
  }
}

/**
 * 일정 미지정 Plans 조회 (start_date 또는 end_date가 null)
 */
export async function listPlansWithoutDates({
  workspaceId,
  filters,
}: {
  workspaceId: string;
  filters?: PlanFilters;
}): Promise<PlanWithAssignees[]> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("plans")
      .select(
        `
        *,
        plan_assignees (
          plan_id,
          workspace_id,
          user_id,
          role
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .or("start_date.is.null,end_date.is.null")
      .order("created_at", { ascending: false });

    // 필터 적용
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[listPlansWithoutDates] Failed:", error);
      // 테이블이 없거나 스키마 문제일 경우 빈 배열 반환
      return [];
    }

    return (data || []) as PlanWithAssignees[];
  } catch (err) {
    console.error("[listPlansWithoutDates] Unexpected error:", err);
    return [];
  }
}

/**
 * 단일 Plan 조회
 */
export async function getPlan({
  workspaceId,
  planId,
}: {
  workspaceId: string;
  planId: string;
}): Promise<PlanWithAssignees | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("plans")
      .select(
        `
        *,
        plan_assignees (
          plan_id,
          workspace_id,
          user_id,
          role
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .eq("id", planId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // not found
      }
      console.error("[getPlan] Failed:", error);
      return null;
    }

    return data as PlanWithAssignees;
  } catch (err) {
    console.error("[getPlan] Unexpected error:", err);
    return null;
  }
}

/**
 * Plan 생성
 */
export async function createPlan({
  workspaceId,
  payload,
  createdBy,
}: {
  workspaceId: string;
  payload: CreatePlanPayload;
  createdBy: string;
}): Promise<Plan> {
  const supabase = await createClient();

  // feature type 검증
  if (payload.type === "feature") {
    if (
      !payload.domain ||
      !payload.project ||
      !payload.module ||
      !payload.feature
    ) {
      throw new Error(
        "feature type 계획은 domain/project/module/feature가 모두 필수입니다."
      );
    }
  }

  // 날짜 검증
  if (payload.start_date && payload.end_date) {
    if (new Date(payload.end_date) < new Date(payload.start_date)) {
      throw new Error("종료일은 시작일보다 이후여야 합니다.");
    }
  }

  const { data, error } = await supabase
    .from("plans")
    .insert({
      workspace_id: workspaceId,
      type: payload.type,
      title: payload.title,
      stage: payload.stage,
      status: payload.status || "진행중",
      domain: payload.domain || null,
      project: payload.project || null,
      module: payload.module || null,
      feature: payload.feature || null,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error("[createPlan] Failed:", error);
    throw error;
  }

  return data as Plan;
}

/**
 * Plan 수정
 */
export async function updatePlan({
  workspaceId,
  planId,
  payload,
  updatedBy,
}: {
  workspaceId: string;
  planId: string;
  payload: Partial<CreatePlanPayload>;
  updatedBy: string;
}): Promise<Plan> {
  const supabase = await createClient();

  // feature type 검증 (type이 변경되는 경우)
  if (payload.type === "feature") {
    if (
      !payload.domain ||
      !payload.project ||
      !payload.module ||
      !payload.feature
    ) {
      throw new Error(
        "feature type 계획은 domain/project/module/feature가 모두 필수입니다."
      );
    }
  }

  // 날짜 검증
  if (payload.start_date && payload.end_date) {
    if (new Date(payload.end_date) < new Date(payload.start_date)) {
      throw new Error("종료일은 시작일보다 이후여야 합니다.");
    }
  }

  const updateData: Record<string, unknown> = {
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };

  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.stage !== undefined) updateData.stage = payload.stage;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.domain !== undefined) updateData.domain = payload.domain;
  if (payload.project !== undefined) updateData.project = payload.project;
  if (payload.module !== undefined) updateData.module = payload.module;
  if (payload.feature !== undefined) updateData.feature = payload.feature;
  if (payload.start_date !== undefined)
    updateData.start_date = payload.start_date;
  if (payload.end_date !== undefined) updateData.end_date = payload.end_date;

  const { data, error } = await supabase
    .from("plans")
    .update(updateData)
    .eq("workspace_id", workspaceId)
    .eq("id", planId)
    .select()
    .single();

  if (error) {
    console.error("[updatePlan] Failed:", error);
    throw error;
  }

  return data as Plan;
}

/**
 * Plan 삭제
 */
export async function deletePlan({
  workspaceId,
  planId,
}: {
  workspaceId: string;
  planId: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", planId);

  if (error) {
    console.error("[deletePlan] Failed:", error);
    throw error;
  }
}

/**
 * 필터 옵션 조회 (domain, project, module 등의 고유값)
 */
export async function getFilterOptions({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<{
  domains: string[];
  projects: string[];
  modules: string[];
  features: string[];
  stages: string[];
}> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("plans")
      .select("domain, project, module, feature, stage")
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("[getFilterOptions] Failed:", error);
      // 테이블이 없으면 빈 옵션 반환
      return {
        domains: [],
        projects: [],
        modules: [],
        features: [],
        stages: [],
      };
    }

    const domains = new Set<string>();
    const projects = new Set<string>();
    const modules = new Set<string>();
    const features = new Set<string>();
    const stages = new Set<string>();

    for (const row of data || []) {
      if (row.domain) domains.add(row.domain);
      if (row.project) projects.add(row.project);
      if (row.module) modules.add(row.module);
      if (row.feature) features.add(row.feature);
      if (row.stage) stages.add(row.stage);
    }

    return {
      domains: Array.from(domains).sort(),
      projects: Array.from(projects).sort(),
      modules: Array.from(modules).sort(),
      features: Array.from(features).sort(),
      stages: Array.from(stages).sort(),
    };
  } catch (err) {
    console.error("[getFilterOptions] Unexpected error:", err);
    return {
      domains: [],
      projects: [],
      modules: [],
      features: [],
      stages: [],
    };
  }
}
