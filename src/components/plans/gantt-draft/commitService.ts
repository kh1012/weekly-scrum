/**
 * Commit Service
 * - Draft 데이터를 서버에 벌크 업서트
 */

"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { revalidatePath } from "next/cache";
import type { CommitPayload, DraftFlag } from "./types";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface CommitResult {
  success: boolean;
  error?: string;
  upsertedCount?: number;
  deletedCount?: number;
  savedItems?: { title: string; action: string }[];
}

/**
 * Feature Plans 벌크 업서트
 * - dirty/deleted bars만 전송
 * - client_uid 기준 upsert
 */
export async function commitFeaturePlans(
  payload: CommitPayload
): Promise<CommitResult> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return {
        success: false,
        error: "권한이 없습니다. 관리자만 저장할 수 있습니다.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 데이터 검증
    if (!payload.plans || payload.plans.length === 0) {
      return { success: true, upsertedCount: 0, deletedCount: 0 };
    }

    // 삭제 대상과 업서트 대상 분리
    const toDelete = payload.plans.filter((p) => p.deleted);
    const toUpsert = payload.plans.filter((p) => !p.deleted);

    let deletedCount = 0;
    let upsertedCount = 0;
    const savedItems: { title: string; action: "insert" | "update" | "delete" }[] = [];

    // Service Role 클라이언트 사용 (RLS 우회)
    // 이미 권한 검증 완료했으므로 안전함
    const adminSupabase = createServiceRoleClient();

    // 삭제 처리 (병렬)
    if (toDelete.length > 0) {

      const deleteResults = await Promise.all(
        toDelete.map(async (plan) => {
          const serverId = (plan as unknown as { serverId?: string }).serverId;

          let deleteQuery = adminSupabase
            .from("plans")
            .delete()
            .eq("workspace_id", payload.workspaceId || DEFAULT_WORKSPACE_ID);

          if (serverId) {
            deleteQuery = deleteQuery.eq("id", serverId);
          } else {
            deleteQuery = deleteQuery.eq("client_uid", plan.clientUid);
          }

          const { error: deleteError } = await deleteQuery;

          if (deleteError) {
            return { success: false, title: plan.title };
          }

          return { success: true, title: plan.title };
        })
      );

      const failedDeletes = deleteResults.filter((r) => !r.success);
      if (failedDeletes.length > 0) {
        return { success: false, error: "삭제 중 오류가 발생했습니다." };
      }
      deletedCount = deleteResults.length;

      // 삭제된 항목 정보 수집
      savedItems.push(
        ...deleteResults
          .filter((r) => r.success)
          .map((r) => ({
            title: r.title,
            action: "delete" as const,
          }))
      );
    }

    // 업서트 처리 (병렬)
    if (toUpsert.length > 0) {
      const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

      const upsertResults = await Promise.all(
        toUpsert.map(async (plan) => {
          // 기존 plan 조회 (client_uid 기준)
          const { data: existingPlan } = await adminSupabase
            .from("plans")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("client_uid", plan.clientUid)
            .single();

          if (existingPlan) {
            // Update
            const { error: updateError } = await adminSupabase
              .from("plans")
              .update({
                type: "feature",
                domain: plan.domain || null,
                project: plan.project,
                module: plan.module,
                feature: plan.feature,
                title: plan.title,
                stage: plan.stage,
                status: plan.status,
                start_date: plan.start_date,
                end_date: plan.end_date,
                description: plan.description || null,
                links: plan.links || [],
                order_index: plan.order_index ?? 0,
                lane_hint: plan.lane_hint ?? null,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingPlan.id);

            if (updateError) {
              return { success: false, title: plan.title, error: updateError.message };
            }

            // 담당자 업데이트 - 기존 삭제 후 새로 추가
            await adminSupabase
              .from("plan_assignees")
              .delete()
              .eq("plan_id", existingPlan.id);

            if (plan.assignees && plan.assignees.length > 0) {
              const assigneeRows = plan.assignees.map((a) => ({
                plan_id: existingPlan.id,
                workspace_id: workspaceId,
                user_id: a.userId,
                role: a.role,
              }));

              await adminSupabase.from("plan_assignees").insert(assigneeRows);
            }

            return { success: true, title: plan.title, action: "update" };
          } else {
            // Insert
            const { data: newPlan, error: insertError } = await adminSupabase
              .from("plans")
              .insert({
                workspace_id: workspaceId,
                client_uid: plan.clientUid,
                type: "feature",
                domain: plan.domain || null,
                project: plan.project,
                module: plan.module,
                feature: plan.feature,
                title: plan.title,
                stage: plan.stage,
                status: plan.status,
                start_date: plan.start_date,
                end_date: plan.end_date,
                description: plan.description || null,
                links: plan.links || [],
                order_index: plan.order_index ?? 0,
                lane_hint: plan.lane_hint ?? null,
                created_by: user.id,
                updated_by: user.id,
              })
              .select("id")
              .single();

            if (insertError) {
              return { success: false, title: plan.title, error: insertError.message };
            }

            // 담당자 추가
            if (plan.assignees && plan.assignees.length > 0 && newPlan) {
              const assigneeRows = plan.assignees.map((a) => ({
                plan_id: newPlan.id,
                workspace_id: workspaceId,
                user_id: a.userId,
                role: a.role,
              }));

              await adminSupabase.from("plan_assignees").insert(assigneeRows);
            }

            return { success: true, title: plan.title, action: "insert" };
          }
        })
      );

      const failedUpserts = upsertResults.filter((r) => !r.success);
      if (failedUpserts.length > 0) {
        const failedTitles = failedUpserts.map((r) => r.title).join(", ");
        return { success: false, error: `저장 실패: ${failedTitles}` };
      }
      upsertedCount = upsertResults.length;

      // 저장된 항목 정보 수집
      savedItems.push(
        ...upsertResults
          .filter((r) => r.success)
          .map((r) => ({
            title: r.title,
            action: r.action as "insert" | "update",
          }))
      );
    }

    // 경로 재검증
    revalidatePath("/works/plans");
    revalidatePath("/works/plans/gantt");
    revalidatePath("/admin/plans");

    return {
      success: true,
      upsertedCount,
      deletedCount,
      savedItems,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

interface FetchedAssignee {
  userId: string;
  role: string;
  displayName?: string;
}

interface FetchFeaturePlansOptions {
  workspaceId?: string;
  onlyMine?: boolean; // 내가 담당자로 지정된 plan만 필터링
}

/**
 * Plans의 최대 updated_at 및 업데이트한 사용자 정보 조회
 */
export async function getPlansMaxUpdatedAt(workspaceId: string): Promise<{
  success: boolean;
  maxUpdatedAt?: string;
  updatedByName?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 가장 최근 업데이트된 plan 조회
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select("updated_at, updated_by")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (planError) {
      return { success: false, error: "데이터 조회에 실패했습니다." };
    }

    // 업데이트한 사용자의 이름 조회
    let updatedByName: string | undefined;
    if (planData?.updated_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", planData.updated_by)
        .single();

      updatedByName = profileData?.display_name || undefined;
    }

    return {
      success: true,
      maxUpdatedAt: planData?.updated_at,
      updatedByName,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export async function fetchFeaturePlans(
  workspaceIdOrOptions?: string | FetchFeaturePlansOptions
): Promise<{
  success: boolean;
  plans?: Array<{
    id: string;
    clientUid: string;
    project: string;
    module: string;
    feature: string;
    title: string;
    stage: string;
    status: string;
    startDate: string;
    endDate: string;
    domain?: string;
    description?: string;
    links?: { url: string; label?: string }[];
    orderIndex: number; // 트리 순서
    laneHint?: number; // 사용자 지정 레인
    assignees?: FetchedAssignee[];
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 호환성 유지: string이면 workspaceId로, object면 options로 처리
    const options: FetchFeaturePlansOptions =
      typeof workspaceIdOrOptions === "string"
        ? { workspaceId: workspaceIdOrOptions }
        : workspaceIdOrOptions || {};

    const targetWorkspaceId = options.workspaceId || DEFAULT_WORKSPACE_ID;
    const onlyMine = options.onlyMine || false;

    // onlyMine 필터를 위해 현재 사용자 ID 조회
    let currentUserId: string | null = null;
    if (onlyMine) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
      if (!currentUserId) {
        return { success: true, plans: [] };
      }
    }

    // plans 조회 (order_index 우선 정렬)
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .eq("workspace_id", targetWorkspaceId)
      .eq("type", "feature")
      .not("start_date", "is", null)
      .not("end_date", "is", null)
      .order("order_index", { ascending: true, nullsFirst: true })
      .order("start_date", { ascending: true });

    if (plansError) {
      return { success: false, error: "데이터 조회에 실패했습니다." };
    }

    if (!plansData || plansData.length === 0) {
      return { success: true, plans: [] };
    }

    // plan_assignees 조회 (profiles와 별도 조회)
    const planIds = plansData.map((p) => p.id);
    const { data: assigneesData, error: assigneesError } = await supabase
      .from("plan_assignees")
      .select("plan_id, user_id, role")
      .eq("workspace_id", targetWorkspaceId)
      .in("plan_id", planIds);

    if (assigneesError) {
      // 담당자 조회 실패해도 계획은 반환
    }

    // onlyMine 필터: 현재 사용자가 assignee인 plan_id 목록 추출
    let filteredPlanIds: Set<string> | null = null;
    if (onlyMine && currentUserId) {
      filteredPlanIds = new Set(
        (assigneesData || [])
          .filter((a) => a.user_id === currentUserId)
          .map((a) => a.plan_id)
      );
    }

    // profiles 별도 조회
    const userIds = [...new Set((assigneesData || []).map((a) => a.user_id))];
    let profilesMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      if (profilesError) {
        // 프로필 조회 실패 무시
      } else {
        for (const p of profilesData || []) {
          if (p.display_name) {
            profilesMap.set(p.user_id, p.display_name);
          }
        }
      }
    }

    // assignees를 plan_id 기준으로 그룹핑
    const assigneesMap = new Map<string, FetchedAssignee[]>();
    for (const a of assigneesData || []) {
      const planId = a.plan_id;
      if (!assigneesMap.has(planId)) {
        assigneesMap.set(planId, []);
      }
      assigneesMap.get(planId)!.push({
        userId: a.user_id,
        role: a.role,
        displayName: profilesMap.get(a.user_id) || undefined,
      });
    }

    // onlyMine 필터 적용: 현재 사용자가 담당자인 plan만 남김
    const filteredPlansData = filteredPlanIds
      ? plansData.filter((p) => filteredPlanIds!.has(p.id))
      : plansData;

    const plans = filteredPlansData.map((row) => ({
      id: row.id,
      clientUid: row.client_uid || row.id,
      project: row.project || "",
      module: row.module || "",
      feature: row.feature || "",
      title: row.title,
      stage: row.stage,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      domain: row.domain,
      description: row.description || undefined,
      links: row.links || undefined,
      orderIndex: row.order_index ?? 0, // 순서 인덱스 추가
      laneHint: row.lane_hint ?? undefined, // 사용자 지정 레인
      assignees: assigneesMap.get(row.id) || [],
    }));

    return { success: true, plans };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Flag 커밋 결과 타입
 */
interface CommitFlagsResult {
  success: boolean;
  error?: string;
  createdCount?: number;
  updatedCount?: number;
  deletedCount?: number;
}

/**
 * Flags 벌크 커밋
 * - dirty/deleted flags만 전송
 * - clientId 기준 upsert
 */
export async function commitFlags(payload: {
  workspaceId: string;
  flags: DraftFlag[];
}): Promise<CommitFlagsResult> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return {
        success: false,
        error: "권한이 없습니다. 관리자만 저장할 수 있습니다.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 데이터 검증
    if (!payload.flags || payload.flags.length === 0) {
      return {
        success: true,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
      };
    }

    // 삭제 대상과 업서트 대상 분리
    const toDelete = payload.flags.filter((f) => f.deleted && f.serverId);
    const toCreate = payload.flags.filter(
      (f) => !f.deleted && !f.serverId && f.dirty
    );
    const toUpdate = payload.flags.filter(
      (f) => !f.deleted && f.serverId && f.dirty
    );

    let deletedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

    // Service Role 클라이언트 사용 (RLS 우회)
    const adminSupabase = createServiceRoleClient();

    // 삭제 처리
    for (const flag of toDelete) {
      const { error: deleteError } = await adminSupabase
        .from("gantt_flags")
        .delete()
        .eq("id", flag.serverId);

      if (deleteError) {
        return { success: false, error: `Flag 삭제 오류: ${flag.title}` };
      }
      deletedCount++;
    }

    // 생성 처리
    for (const flag of toCreate) {
      const { error: insertError } = await adminSupabase
        .from("gantt_flags")
        .insert({
          workspace_id: workspaceId,
          title: flag.title,
          start_date: flag.startDate,
          end_date: flag.endDate,
          color: flag.color || null,
          order_index: flag.orderIndex,
          lane_hint: flag.laneHint ?? null,
          description: flag.description || null,
          links: flag.links || [],
          created_by: user.id,
        });

      if (insertError) {
        return { success: false, error: `Flag 생성 오류: ${flag.title}` };
      }
      createdCount++;
    }

    // 수정 처리
    for (const flag of toUpdate) {
      const { error: updateError } = await adminSupabase
        .from("gantt_flags")
        .update({
          title: flag.title,
          start_date: flag.startDate,
          end_date: flag.endDate,
          color: flag.color || null,
          order_index: flag.orderIndex,
          lane_hint: flag.laneHint ?? null,
          description: flag.description || null,
          links: flag.links || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", flag.serverId);

      if (updateError) {
        return { success: false, error: `Flag 수정 오류: ${flag.title}` };
      }
      updatedCount++;
    }

    // 경로 재검증
    revalidatePath("/works/plans");
    revalidatePath("/works/plans/gantt");
    revalidatePath("/admin/plans");

    return {
      success: true,
      createdCount,
      updatedCount,
      deletedCount,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
