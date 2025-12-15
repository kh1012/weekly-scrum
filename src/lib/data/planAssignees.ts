import { createClient } from "@/lib/supabase/server";
import type { AssigneeRole, PlanAssignee } from "./plans";

/**
 * Assignee 입력 타입
 */
export interface AssigneeInput {
  user_id: string;
  role: AssigneeRole;
}

/**
 * Plan의 담당자 목록 조회
 */
export async function listAssignees({
  workspaceId,
  planId,
}: {
  workspaceId: string;
  planId: string;
}): Promise<PlanAssignee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plan_assignees")
    .select(`
      plan_id,
      workspace_id,
      user_id,
      role,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("plan_id", planId);

  if (error) {
    console.error("[listAssignees] Failed:", error);
    throw error;
  }

  interface AssigneeRow {
    plan_id: string;
    workspace_id: string;
    user_id: string;
    role: AssigneeRole;
    profiles: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null;
  }

  return ((data || []) as AssigneeRow[]).map((row) => {
    const profileData = row.profiles;
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;
    return {
      plan_id: row.plan_id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      role: row.role,
      profiles: profile || undefined,
    };
  });
}

/**
 * Plan의 담당자 교체 (diff 방식)
 * - PK: (plan_id, user_id, role)
 * - 기존 담당자와 비교하여 추가/삭제
 */
export async function replaceAssignees({
  workspaceId,
  planId,
  assignees,
}: {
  workspaceId: string;
  planId: string;
  assignees: AssigneeInput[];
}): Promise<void> {
  const supabase = await createClient();

  // 1. 기존 담당자 조회
  const { data: existingData, error: fetchError } = await supabase
    .from("plan_assignees")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("plan_id", planId);

  if (fetchError) {
    console.error("[replaceAssignees] Failed to fetch existing:", fetchError);
    throw fetchError;
  }

  const existingSet = new Set(
    (existingData || []).map((a) => `${a.user_id}:${a.role}`)
  );
  const newSet = new Set(assignees.map((a) => `${a.user_id}:${a.role}`));

  // 2. 삭제할 담당자 (existing - new)
  const toDelete = (existingData || []).filter(
    (a) => !newSet.has(`${a.user_id}:${a.role}`)
  );

  // 3. 추가할 담당자 (new - existing)
  const toInsert = assignees.filter(
    (a) => !existingSet.has(`${a.user_id}:${a.role}`)
  );

  // 4. 삭제 실행
  for (const item of toDelete) {
    const { error: deleteError } = await supabase
      .from("plan_assignees")
      .delete()
      .eq("plan_id", planId)
      .eq("user_id", item.user_id)
      .eq("role", item.role);

    if (deleteError) {
      console.error("[replaceAssignees] Delete failed:", deleteError);
      throw deleteError;
    }
  }

  // 5. 추가 실행
  if (toInsert.length > 0) {
    const insertData = toInsert.map((a) => ({
      plan_id: planId,
      workspace_id: workspaceId,
      user_id: a.user_id,
      role: a.role,
    }));

    const { error: insertError } = await supabase
      .from("plan_assignees")
      .insert(insertData);

    if (insertError) {
      console.error("[replaceAssignees] Insert failed:", insertError);
      throw insertError;
    }
  }
}

/**
 * Plan의 모든 담당자 삭제
 */
export async function clearAssignees({
  workspaceId,
  planId,
}: {
  workspaceId: string;
  planId: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("plan_assignees")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("plan_id", planId);

  if (error) {
    console.error("[clearAssignees] Failed:", error);
    throw error;
  }
}

