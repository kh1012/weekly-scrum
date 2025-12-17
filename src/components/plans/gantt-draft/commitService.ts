/**
 * Commit Service
 * - Draft 데이터를 서버에 벌크 업서트
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { revalidatePath } from "next/cache";
import type { CommitPayload } from "./types";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface CommitResult {
  success: boolean;
  error?: string;
  upsertedCount?: number;
  deletedCount?: number;
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
      return { success: false, error: "권한이 없습니다. 관리자만 저장할 수 있습니다." };
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

    // 삭제 처리
    if (toDelete.length > 0) {
      for (const plan of toDelete) {
        // serverId가 있으면 id로 삭제, 없으면 client_uid로 삭제
        const serverId = (plan as unknown as { serverId?: string }).serverId;
        
        let deleteQuery = supabase
          .from("plans")
          .delete()
          .eq("workspace_id", payload.workspaceId || DEFAULT_WORKSPACE_ID);
        
        if (serverId) {
          // 서버 ID로 삭제 (기존 데이터)
          deleteQuery = deleteQuery.eq("id", serverId);
        } else {
          // client_uid로 삭제 (새로 생성된 데이터)
          deleteQuery = deleteQuery.eq("client_uid", plan.clientUid);
        }
        
        const { error: deleteError } = await deleteQuery;

        if (deleteError) {
          console.error("[commitFeaturePlans] Delete error:", deleteError, { plan });
          return { success: false, error: "삭제 중 오류가 발생했습니다." };
        }
        
        deletedCount++;
      }
    }

    // 업서트 처리
    if (toUpsert.length > 0) {
      const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

      for (const plan of toUpsert) {
        // 기존 plan 조회 (client_uid 기준)
        const { data: existingPlan } = await supabase
          .from("plans")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("client_uid", plan.clientUid)
          .single();

        if (existingPlan) {
          // Update
          const { error: updateError } = await supabase
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
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPlan.id);

          if (updateError) {
            console.error("[commitFeaturePlans] Update error:", updateError);
            return { success: false, error: `업데이트 오류: ${plan.title}` };
          }

          // 담당자 업데이트 - 항상 기존 담당자 삭제 후 새로 추가
          await supabase
            .from("plan_assignees")
            .delete()
            .eq("plan_id", existingPlan.id);

          if (plan.assignees && plan.assignees.length > 0) {
            // 새 담당자 추가
            const assigneeRows = plan.assignees.map((a) => ({
              plan_id: existingPlan.id,
              workspace_id: workspaceId,
              user_id: a.userId,
              role: a.role,
            }));

            const { error: assigneeError } = await supabase.from("plan_assignees").insert(assigneeRows);
            if (assigneeError) {
              console.error("[commitFeaturePlans] Assignee insert error:", assigneeError);
            }
          }
        } else {
          // Insert
          const { data: newPlan, error: insertError } = await supabase
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
              created_by: user.id,
              updated_by: user.id,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("[commitFeaturePlans] Insert error:", insertError);
            return { success: false, error: `생성 오류: ${plan.title}` };
          }

          // 담당자 추가
          if (plan.assignees && plan.assignees.length > 0 && newPlan) {
            const assigneeRows = plan.assignees.map((a) => ({
              plan_id: newPlan.id,
              workspace_id: workspaceId,
              user_id: a.userId,
              role: a.role,
            }));

            await supabase.from("plan_assignees").insert(assigneeRows);
          }
        }

        upsertedCount++;
      }
    }

    // 경로 재검증
    revalidatePath("/plans");
    revalidatePath("/plans/gantt");
    revalidatePath("/admin/plans");

    return {
      success: true,
      upsertedCount,
      deletedCount,
    };
  } catch (err) {
    console.error("[commitFeaturePlans] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

interface FetchedAssignee {
  userId: string;
  role: string;
  displayName?: string;
}

/**
 * Feature Plans 조회 (hydrate용)
 */
export async function fetchFeaturePlans(
  workspaceId?: string
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
    assignees?: FetchedAssignee[];
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const targetWorkspaceId = workspaceId || DEFAULT_WORKSPACE_ID;

    // plans 조회
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .eq("workspace_id", targetWorkspaceId)
      .eq("type", "feature")
      .not("start_date", "is", null)
      .not("end_date", "is", null)
      .order("start_date", { ascending: true });

    if (plansError) {
      console.error("[fetchFeaturePlans] Plans error:", plansError);
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
      console.error("[fetchFeaturePlans] Assignees error:", assigneesError);
      // 담당자 조회 실패해도 계획은 반환
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
        console.error("[fetchFeaturePlans] Profiles error:", profilesError);
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

    const plans = plansData.map((row) => ({
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
      assignees: assigneesMap.get(row.id) || [],
    }));

    console.log("[fetchFeaturePlans] Loaded", plans.length, "plans with assignees");

    return { success: true, plans };
  } catch (err) {
    console.error("[fetchFeaturePlans] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

