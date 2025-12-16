import { createClient } from "@/lib/supabase/server";

/**
 * Plan 타입 (DB plan_type enum)
 * - feature: 기능 개발 계획 (domain/project/module/feature 필수)
 * - sprint: 스프린트 (title, start_date, end_date)
 * - release: 릴리즈 (title, start_date, end_date)
 */
export type PlanType = "feature" | "sprint" | "release";

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
 * IMPORTANT CONTRACT:
 * This function is tightly coupled to the SQL view `v_plans_with_assignees`.
 * Any change to the view schema MUST update this mapping.
 */
interface ViewPlanRow {
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
  // 뷰에서 제공하는 추가 필드
  assignees: PlanAssignee[] | null;
  creator?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

/**
 * 뷰 Row를 PlanWithAssignees로 변환
 */
function transformViewRowToPlan(row: ViewPlanRow): PlanWithAssignees {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    type: row.type,
    domain: row.domain,
    project: row.project,
    module: row.module,
    feature: row.feature,
    title: row.title,
    stage: row.stage,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignees: row.assignees || [],
    creator: row.creator || undefined,
  };
}

/**
 * 월 범위 기반 Plans 조회
 * - v_plans_with_assignees 뷰 사용 (READ는 항상 뷰 사용)
 * - 해당 월과 겹치는(overlap) 계획을 조회
 * - start_date <= monthEnd AND (end_date is null OR end_date >= monthStart)
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
    // v_plans_with_assignees 뷰 사용 (READ는 항상 뷰)
    let query = supabase
      .from("v_plans_with_assignees")
      .select("*")
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
      // 뷰가 없거나 스키마 문제일 경우 빈 배열 반환
      return [];
    }

    // 뷰에서 가져온 데이터 변환 (assignees는 JSON array로 포함됨)
    const plans = (data || []).map(transformViewRowToPlan);

    // assignee 필터는 클라이언트 측에서 처리
    if (filters?.assigneeUserId) {
      return plans.filter((plan) =>
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
 * - v_plans_with_assignees 뷰 사용 (READ는 항상 뷰 사용)
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
    // v_plans_with_assignees 뷰 사용 (READ는 항상 뷰)
    let query = supabase
      .from("v_plans_with_assignees")
      .select("*")
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
      // 뷰가 없거나 스키마 문제일 경우 빈 배열 반환
      return [];
    }

    return (data || []).map(transformViewRowToPlan);
  } catch (err) {
    console.error("[listPlansWithoutDates] Unexpected error:", err);
    return [];
  }
}

/**
 * 단일 Plan 조회
 * - v_plans_with_assignees 뷰 사용 (READ는 항상 뷰 사용)
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
    // v_plans_with_assignees 뷰 사용 (READ는 항상 뷰)
    const { data, error } = await supabase
      .from("v_plans_with_assignees")
      .select("*")
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

    return transformViewRowToPlan(data);
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
 * - v_plans_with_assignees 뷰 사용 (READ는 항상 뷰 사용)
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
    // v_plans_with_assignees 뷰 사용 (READ는 항상 뷰)
    const { data, error } = await supabase
      .from("v_plans_with_assignees")
      .select("domain, project, module, feature, stage")
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("[getFilterOptions] Failed:", error);
      // 뷰가 없으면 빈 옵션 반환
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
