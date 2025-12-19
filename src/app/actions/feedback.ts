/**
 * Feedback Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Feedback,
  FeedbackWithAuthor,
  FeedbackWithDetails,
  FeedbackStatus,
  Release,
} from "@/lib/data/feedback";

/**
 * 현재 사용자 권한 및 workspace_id 조회
 */
async function getUserInfo(): Promise<{
  userId: string | null;
  role: string | null;
  workspaceId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, role: null, workspaceId: null };

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();

  return {
    userId: user.id,
    role: member?.role || null,
    workspaceId: member?.workspace_id || null,
  };
}

/**
 * 현재 사용자 권한 조회
 */
async function getUserRole(): Promise<string | null> {
  const info = await getUserInfo();
  return info.role;
}

/**
 * 피드백 목록 조회
 */
export async function listFeedbacks(): Promise<{
  success: boolean;
  feedbacks?: FeedbackWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const userInfo = await getUserInfo();

    if (!userInfo.workspaceId) {
      return { success: false, error: "워크스페이스 정보가 없습니다." };
    }

    // feedbacks + profiles + releases 조인
    const { data, error } = await supabase
      .from("feedbacks")
      .select(
        `
        *,
        author:profiles!feedbacks_author_user_id_fkey(display_name, email),
        release:releases(version, title)
      `
      )
      .eq("workspace_id", userInfo.workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[listFeedbacks] Error:", error);
      return { success: false, error: "피드백 목록 조회 실패" };
    }

    const feedbacks: FeedbackWithDetails[] = (data || []).map((item: any) => ({
      id: item.id,
      workspace_id: item.workspace_id,
      author_user_id: item.author_user_id,
      title: item.title,
      content: item.content,
      status: item.status,
      resolved_release_id: item.resolved_release_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      resolved_at: item.resolved_at,
      author_name: item.author?.display_name || "Unknown",
      author_email: item.author?.email,
      release_version: item.release?.version,
      release_title: item.release?.title,
    }));

    return { success: true, feedbacks };
  } catch (err) {
    console.error("[listFeedbacks] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드백 상세 조회
 */
export async function getFeedback(
  id: string
): Promise<{
  success: boolean;
  feedback?: FeedbackWithDetails;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feedbacks")
      .select(
        `
        *,
        author:profiles!feedbacks_author_user_id_fkey(display_name, email),
        release:releases(version, title)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("[getFeedback] Error:", error);
      return { success: false, error: "피드백 조회 실패" };
    }

    const feedback: FeedbackWithDetails = {
      id: data.id,
      workspace_id: data.workspace_id,
      author_user_id: data.author_user_id,
      title: data.title,
      content: data.content,
      status: data.status,
      resolved_release_id: data.resolved_release_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      resolved_at: data.resolved_at,
      author_name: data.author?.display_name || "Unknown",
      author_email: data.author?.email,
      release_version: data.release?.version,
      release_title: data.release?.title,
    };

    return { success: true, feedback };
  } catch (err) {
    console.error("[getFeedback] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드백 생성
 */
export async function createFeedback(data: {
  title?: string;
  content: string;
}): Promise<{
  success: boolean;
  feedbackId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const userInfo = await getUserInfo();

    if (!userInfo.userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    if (!userInfo.workspaceId) {
      return { success: false, error: "워크스페이스 정보가 없습니다." };
    }

    const { data: feedback, error } = await supabase
      .from("feedbacks")
      .insert({
        workspace_id: userInfo.workspaceId,
        author_user_id: userInfo.userId,
        title: data.title || null,
        content: data.content,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createFeedback] Error:", error);
      return { success: false, error: "피드백 생성 실패" };
    }

    revalidatePath("/feedbacks");
    return { success: true, feedbackId: feedback.id };
  } catch (err) {
    console.error("[createFeedback] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드백 수정 (본인 또는 admin/leader)
 */
export async function updateFeedback(
  id: string,
  data: {
    title?: string;
    content?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("feedbacks")
      .update(data)
      .eq("id", id);

    if (error) {
      console.error("[updateFeedback] Error:", error);
      return { success: false, error: "피드백 수정 실패" };
    }

    revalidatePath("/feedbacks");
    revalidatePath(`/feedbacks/${id}`);
    return { success: true };
  } catch (err) {
    console.error("[updateFeedback] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드백 삭제 (본인 또는 admin/leader)
 */
export async function deleteFeedback(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("feedbacks").delete().eq("id", id);

    if (error) {
      console.error("[deleteFeedback] Error:", error);
      return { success: false, error: "피드백 삭제 실패" };
    }

    revalidatePath("/feedbacks");
    return { success: true };
  } catch (err) {
    console.error("[deleteFeedback] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드백 상태 변경 (admin/leader만)
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  resolvedReleaseId?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const role = await getUserRole();
    if (!role || !["admin", "leader"].includes(role)) {
      return { success: false, error: "권한이 없습니다." };
    }

    const supabase = await createClient();

    const updateData: any = { status };
    if (status === "resolved" && resolvedReleaseId) {
      updateData.resolved_release_id = resolvedReleaseId;
    }

    const { error } = await supabase
      .from("feedbacks")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[updateFeedbackStatus] Error:", error);
      return { success: false, error: error.message || "상태 변경 실패" };
    }

    revalidatePath("/feedbacks");
    revalidatePath(`/feedbacks/${id}`);
    return { success: true };
  } catch (err) {
    console.error("[updateFeedbackStatus] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 릴리즈 목록 조회
 */
export async function listReleases(): Promise<{
  success: boolean;
  releases?: Release[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("releases")
      .select("*")
      .order("released_at", { ascending: false });

    if (error) {
      console.error("[listReleases] Error:", error);
      return { success: false, error: "릴리즈 목록 조회 실패" };
    }

    return { success: true, releases: data || [] };
  } catch (err) {
    console.error("[listReleases] Unexpected error:", err);
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 현재 사용자 권한 정보
 */
export async function getCurrentUserRole(): Promise<{
  success: boolean;
  role?: string;
  error?: string;
}> {
  try {
    const role = await getUserRole();
    return { success: true, role: role || "member" };
  } catch (err) {
    console.error("[getCurrentUserRole] Unexpected error:", err);
    return { success: false, error: "권한 조회 실패" };
  }
}

