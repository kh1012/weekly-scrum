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
}

/**
 * Feature Plans 벌크 업서트
 * - dirty/deleted bars만 전송
 * - client_uid 기준 upsert
 */
export async function commitFeaturePlans(
  payload: CommitPayload
): Promise<CommitResult> {
  console.log("💾 [commitFeaturePlans] 시작", {
    plansCount: payload.plans?.length || 0,
    workspaceId: payload.workspaceId,
  });

  try {
    // 권한 확인
    console.log("🔐 [commitFeaturePlans] 권한 확인 중...");
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      console.error("❌ [commitFeaturePlans] 권한 없음");
      return { success: false, error: "권한이 없습니다. 관리자만 저장할 수 있습니다." };
    }
    console.log("✅ [commitFeaturePlans] 권한 확인 완료: admin/leader");

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ [commitFeaturePlans] 사용자 인증 실패:", userError);
      return { success: false, error: "로그인이 필요합니다." };
    }
    console.log("✅ [commitFeaturePlans] 사용자 인증 완료", {
      userId: user.id,
      email: user.email,
    });

    // 데이터 검증
    if (!payload.plans || payload.plans.length === 0) {
      console.log("ℹ️ [commitFeaturePlans] 저장할 데이터 없음");
      return { success: true, upsertedCount: 0, deletedCount: 0 };
    }

    // 삭제 대상과 업서트 대상 분리
    const toDelete = payload.plans.filter((p) => p.deleted);
    const toUpsert = payload.plans.filter((p) => !p.deleted);

    console.log("📊 [commitFeaturePlans] 작업 분류", {
      toDelete: toDelete.length,
      toUpsert: toUpsert.length,
    });

    let deletedCount = 0;
    let upsertedCount = 0;

    // Service Role 클라이언트 사용 (RLS 우회)
    // 이미 권한 검증 완료했으므로 안전함
    console.log("🔓 [commitFeaturePlans] Service Role 클라이언트로 전환 (RLS 우회)");
    const adminSupabase = createServiceRoleClient();

    // 삭제 처리
    if (toDelete.length > 0) {
      console.log("🗑️ [commitFeaturePlans] 삭제 시작:", toDelete.length, "개");
      for (const plan of toDelete) {
        // serverId가 있으면 id로 삭제, 없으면 client_uid로 삭제
        const serverId = (plan as unknown as { serverId?: string }).serverId;
        
        let deleteQuery = adminSupabase
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
          console.error("❌ [commitFeaturePlans] 삭제 오류:", {
            plan: plan.title,
            serverId,
            clientUid: plan.clientUid,
            error: deleteError,
          });
          return { success: false, error: "삭제 중 오류가 발생했습니다." };
        }
        
        console.log("✅ [commitFeaturePlans] 삭제 완료:", plan.title);
        deletedCount++;
      }
    }

    // 업서트 처리
    if (toUpsert.length > 0) {
      console.log("📝 [commitFeaturePlans] 업서트 시작:", toUpsert.length, "개");
      const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

      for (const plan of toUpsert) {
        console.log("🔍 [commitFeaturePlans] 기존 plan 확인:", {
          clientUid: plan.clientUid,
          title: plan.title,
        });

        // 기존 plan 조회 (client_uid 기준)
        const { data: existingPlan } = await adminSupabase
          .from("plans")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("client_uid", plan.clientUid)
          .single();

        if (existingPlan) {
          console.log("🔄 [commitFeaturePlans] UPDATE 시작:", {
            id: existingPlan.id,
            title: plan.title,
          });

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
              order_index: plan.order_index ?? 0,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPlan.id);

          if (updateError) {
            console.error("❌ [commitFeaturePlans] UPDATE 오류:", {
              id: existingPlan.id,
              title: plan.title,
              error: {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint,
              },
            });
            return { success: false, error: `업데이트 오류: ${plan.title}` };
          }

          console.log("✅ [commitFeaturePlans] UPDATE 완료:", plan.title);

          // 담당자 업데이트 - 항상 기존 담당자 삭제 후 새로 추가
          console.log("👥 [commitFeaturePlans] 담당자 업데이트 시작");
          await adminSupabase
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

            console.log("➕ [commitFeaturePlans] 담당자 추가:", assigneeRows.length, "명");
            const { error: assigneeError } = await adminSupabase.from("plan_assignees").insert(assigneeRows);
            if (assigneeError) {
              console.error("❌ [commitFeaturePlans] 담당자 추가 오류:", {
                error: assigneeError,
                assigneeRows,
              });
            } else {
              console.log("✅ [commitFeaturePlans] 담당자 추가 완료");
            }
          }
        } else {
          console.log("➕ [commitFeaturePlans] INSERT 시작:", {
            clientUid: plan.clientUid,
            title: plan.title,
          });

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
              order_index: plan.order_index ?? 0,
              created_by: user.id,
              updated_by: user.id,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("❌ [commitFeaturePlans] INSERT 오류:", {
              title: plan.title,
              error: {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
              },
            });
            return { success: false, error: `생성 오류: ${plan.title}` };
          }

          console.log("✅ [commitFeaturePlans] INSERT 완료:", {
            id: newPlan.id,
            title: plan.title,
          });

          // 담당자 추가
          if (plan.assignees && plan.assignees.length > 0 && newPlan) {
            const assigneeRows = plan.assignees.map((a) => ({
              plan_id: newPlan.id,
              workspace_id: workspaceId,
              user_id: a.userId,
              role: a.role,
            }));

            console.log("➕ [commitFeaturePlans] 담당자 추가:", assigneeRows.length, "명");
            const { error: assigneeError } = await adminSupabase.from("plan_assignees").insert(assigneeRows);
            if (assigneeError) {
              console.error("❌ [commitFeaturePlans] 담당자 추가 오류:", assigneeError);
            } else {
              console.log("✅ [commitFeaturePlans] 담당자 추가 완료");
            }
          }
        }

        upsertedCount++;
      }
    }

    console.log("✅ [commitFeaturePlans] 커밋 완료", {
      upsertedCount,
      deletedCount,
    });

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
    console.error("❌ [commitFeaturePlans] 예외 발생:", err);
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
    orderIndex: number; // 트리 순서
    assignees?: FetchedAssignee[];
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const targetWorkspaceId = workspaceId || DEFAULT_WORKSPACE_ID;

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
      orderIndex: row.order_index ?? 0, // 순서 인덱스 추가
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
    if (!payload.flags || payload.flags.length === 0) {
      return { success: true, createdCount: 0, updatedCount: 0, deletedCount: 0 };
    }

    // 삭제 대상과 업서트 대상 분리
    const toDelete = payload.flags.filter((f) => f.deleted && f.serverId);
    const toCreate = payload.flags.filter((f) => !f.deleted && !f.serverId && f.dirty);
    const toUpdate = payload.flags.filter((f) => !f.deleted && f.serverId && f.dirty);

    let deletedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

    // Service Role 클라이언트 사용 (RLS 우회)
    console.log("🔓 [commitFlags] Service Role 클라이언트로 전환 (RLS 우회)");
    const adminSupabase = createServiceRoleClient();

    // 삭제 처리
    for (const flag of toDelete) {
      const { error: deleteError } = await adminSupabase
        .from("gantt_flags")
        .delete()
        .eq("id", flag.serverId);

      if (deleteError) {
        console.error("[commitFlags] Delete error:", deleteError, { flag });
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
          created_by: user.id,
        });

      if (insertError) {
        console.error("[commitFlags] Insert error:", insertError, { flag });
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", flag.serverId);

      if (updateError) {
        console.error("[commitFlags] Update error:", updateError, { flag });
        return { success: false, error: `Flag 수정 오류: ${flag.title}` };
      }
      updatedCount++;
    }

    // 경로 재검증
    revalidatePath("/plans");
    revalidatePath("/plans/gantt");
    revalidatePath("/admin/plans");

    return {
      success: true,
      createdCount,
      updatedCount,
      deletedCount,
    };
  } catch (err) {
    console.error("[commitFlags] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

