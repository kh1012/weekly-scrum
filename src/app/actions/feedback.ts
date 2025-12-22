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

    // feedbacks + profiles 조인
    const { data, error } = await supabase
      .from("feedbacks")
      .select(
        `
        *,
        author:profiles!feedbacks_author_user_id_fkey(display_name, email),
        resolved_by:profiles!feedbacks_resolved_by_user_id_fkey(display_name)
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
      resolution_note: item.resolution_note,
      resolved_by_user_id: item.resolved_by_user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      author_name: item.author?.display_name || "Unknown",
      author_email: item.author?.email,
      resolved_by_name: item.resolved_by?.display_name,
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
        resolved_by:profiles!feedbacks_resolved_by_user_id_fkey(display_name)
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
      resolution_note: data.resolution_note,
      resolved_by_user_id: data.resolved_by_user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author_name: data.author?.display_name || "Unknown",
      author_email: data.author?.email,
      resolved_by_name: data.resolved_by?.display_name,
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
 * 피드백 수정 (본인만)
 */
export async function updateFeedback(
  id: string,
  data: { title?: string; content: string }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo.userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const supabase = await createClient();

    // 본인 피드백인지 확인
    const { data: feedback } = await supabase
      .from("feedbacks")
      .select("author_user_id")
      .eq("id", id)
      .single();

    if (!feedback) {
      return { success: false, error: "피드백을 찾을 수 없습니다." };
    }

    if (feedback.author_user_id !== userInfo.userId) {
      return { success: false, error: "본인의 피드백만 수정할 수 있습니다." };
    }

    const { error } = await supabase
      .from("feedbacks")
      .update({
        title: data.title || null,
        content: data.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[updateFeedback] Error:", error);
      return { success: false, error: error.message || "피드백 수정 실패" };
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
 * 피드백 상태 변경 (admin/leader만)
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  options?: {
    resolutionNote?: string;
    sendEmail?: boolean;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo.role || !["admin", "leader"].includes(userInfo.role)) {
      return { success: false, error: "권한이 없습니다." };
    }

    // resolved 상태로 변경 시 resolution_note 필수
    if (status === "resolved" && !options?.resolutionNote?.trim()) {
      return { success: false, error: "해결내용을 입력해주세요." };
    }

    const supabase = await createClient();

    // 피드백 정보 조회 (이메일 발송용)
    const { data: feedbackData } = await supabase
      .from("feedbacks")
      .select(`
        *,
        author:profiles!feedbacks_author_user_id_fkey(display_name, email)
      `)
      .eq("id", id)
      .single();

    // 상태 업데이트 데이터 구성
    const updateData: Record<string, unknown> = { status };
    if (status === "resolved") {
      updateData.resolution_note = options?.resolutionNote?.trim();
      updateData.resolved_by_user_id = userInfo.userId;
    }

    // 피드백 상태 업데이트
    const { error } = await supabase
      .from("feedbacks")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[updateFeedbackStatus] Error:", error);
      return { success: false, error: error.message || "상태 변경 실패" };
    }

    // 이메일 발송 (선택적)
    if (status === "resolved" && options?.sendEmail && feedbackData?.author?.email) {
      try {
        await sendResolutionEmail({
          toEmail: feedbackData.author.email,
          toName: feedbackData.author.display_name || "사용자",
          feedbackTitle: feedbackData.title || "피드백",
          resolutionNote: options.resolutionNote || "",
        });
      } catch (emailError) {
        console.error("[updateFeedbackStatus] Email error:", emailError);
        // 이메일 실패해도 상태 변경은 성공으로 처리
      }
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
 * 해결 완료 이메일 발송
 * 
 * 이메일 서비스 연동 필요 (Resend, SendGrid 등)
 * 현재는 로그만 출력 - 실제 연동 시 구현 필요
 */
async function sendResolutionEmail(params: {
  toEmail: string;
  toName: string;
  feedbackTitle: string;
  resolutionNote: string;
}): Promise<void> {
  // TODO: 이메일 서비스 연동 구현
  // Resend, SendGrid, SMTP 등 선택하여 구현
  console.log("[sendResolutionEmail] Email would be sent to:", params.toEmail);
  console.log("[sendResolutionEmail] Subject: 피드백이 해결되었습니다 -", params.feedbackTitle);
  console.log("[sendResolutionEmail] Resolution Note:", params.resolutionNote);
  
  // 예시: Resend 사용 시
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: params.toEmail,
  //   subject: `[해결됨] ${params.feedbackTitle}`,
  //   html: `<p>${params.toName}님, 피드백이 해결되었습니다.</p><p>${params.resolutionNote}</p>`,
  // });
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

