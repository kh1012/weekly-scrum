/**
 * Flag Service
 * - Gantt Flags CRUD operations
 * - snake_case → camelCase mapping
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { revalidatePath } from "next/cache";
import type { GanttFlag } from "./types";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

/**
 * snake_case → camelCase 매핑
 */
function mapFlagFromDb(row: Record<string, unknown>): GanttFlag {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    title: row.title as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    color: row.color as string | null,
    orderIndex: (row.order_index as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string | null,
  };
}

/**
 * Flag 목록 조회
 * - startDate asc → orderIndex asc → title asc 정렬
 */
export async function listFlags(
  workspaceId?: string
): Promise<{ success: boolean; flags?: GanttFlag[]; error?: string }> {
  try {
    const supabase = await createClient();
    const targetWorkspaceId = workspaceId || DEFAULT_WORKSPACE_ID;

    const { data, error } = await supabase
      .from("gantt_flags")
      .select("*")
      .eq("workspace_id", targetWorkspaceId)
      .order("start_date", { ascending: true })
      .order("order_index", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      console.error("[listFlags] Error:", error);
      return { success: false, error: "Flag 목록 조회에 실패했습니다." };
    }

    const flags = (data || []).map(mapFlagFromDb);
    return { success: true, flags };
  } catch (err) {
    console.error("[listFlags] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Flag 생성
 */
export async function createFlag(payload: {
  workspaceId?: string;
  title: string;
  startDate: string;
  endDate: string;
  color?: string | null;
}): Promise<{ success: boolean; flag?: GanttFlag; error?: string }> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 Flag를 생성할 수 있습니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const workspaceId = payload.workspaceId || DEFAULT_WORKSPACE_ID;

    // 현재 최대 order_index 조회
    const { data: maxOrderData } = await supabase
      .from("gantt_flags")
      .select("order_index")
      .eq("workspace_id", workspaceId)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
      ? (maxOrderData[0].order_index || 0) + 1 
      : 0;

    const { data, error } = await supabase
      .from("gantt_flags")
      .insert({
        workspace_id: workspaceId,
        title: payload.title,
        start_date: payload.startDate,
        end_date: payload.endDate,
        color: payload.color || null,
        order_index: nextOrderIndex,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[createFlag] Error:", error);
      return { success: false, error: "Flag 생성에 실패했습니다." };
    }

    revalidatePath("/admin/plans");

    return { success: true, flag: mapFlagFromDb(data) };
  } catch (err) {
    console.error("[createFlag] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Flag 수정
 */
export async function updateFlag(
  id: string,
  updates: Partial<Pick<GanttFlag, "title" | "startDate" | "endDate" | "orderIndex" | "color">>
): Promise<{ success: boolean; flag?: GanttFlag; error?: string }> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 Flag를 수정할 수 있습니다." };
    }

    const supabase = await createClient();

    // snake_case로 변환
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) {
      dbUpdates.title = updates.title;
    }
    if (updates.startDate !== undefined) {
      dbUpdates.start_date = updates.startDate;
    }
    if (updates.endDate !== undefined) {
      dbUpdates.end_date = updates.endDate;
    }
    if (updates.orderIndex !== undefined) {
      dbUpdates.order_index = updates.orderIndex;
    }
    if (updates.color !== undefined) {
      dbUpdates.color = updates.color;
    }

    const { data, error } = await supabase
      .from("gantt_flags")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[updateFlag] Error:", error);
      return { success: false, error: "Flag 수정에 실패했습니다." };
    }

    revalidatePath("/admin/plans");

    return { success: true, flag: mapFlagFromDb(data) };
  } catch (err) {
    console.error("[updateFlag] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * Flag 삭제
 */
export async function deleteFlag(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 권한 확인
    const hasAccess = await isAdminOrLeader();
    if (!hasAccess) {
      return { success: false, error: "권한이 없습니다. 관리자만 Flag를 삭제할 수 있습니다." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("gantt_flags")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[deleteFlag] Error:", error);
      return { success: false, error: "Flag 삭제에 실패했습니다." };
    }

    revalidatePath("/admin/plans");

    return { success: true };
  } catch (err) {
    console.error("[deleteFlag] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

