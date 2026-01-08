/**
 * Figma 파일 관리 API
 * GET: 등록된 파일 목록 조회 (대시보드용)
 * POST: 새 파일 등록 + Webhook 구독 + 썸네일 생성
 * DELETE: 파일 제거 + Webhook 해제
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/figma/tokenManager";
import crypto from "crypto";

/**
 * GET /api/figma/files?workspace_id=xxx
 * 등록된 Figma 파일 목록 조회 (대시보드용)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // 1. 등록된 파일 목록 조회
    const { data: files, error: filesError } = await supabase
      .from("figma_tracked_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (filesError) throw filesError;

    // 2. 각 파일별 댓글 정보 및 읽음 상태 조회
    const filesWithStats = await Promise.all(
      (files || []).map(async (file) => {
        // 전체 댓글 수
        const { count: totalComments } = await supabase
          .from("figma_comments")
          .select("*", { count: "exact", head: true })
          .eq("file_key", file.file_key);

        // 읽지 않은 댓글 수 (현재 사용자 기준)
        const { data: readComments } = await supabase
          .from("figma_comment_reads")
          .select("comment_id")
          .eq("user_id", user.id);

        const readCommentIds = new Set(
          readComments?.map((r) => r.comment_id) || []
        );

        const { data: allComments } = await supabase
          .from("figma_comments")
          .select("comment_id")
          .eq("file_key", file.file_key);

        const unreadCount =
          (allComments?.filter((c) => !readCommentIds.has(c.comment_id))
            .length || 0);

        // 마지막 댓글 프리뷰
        const { data: lastComment } = await supabase
          .from("figma_comments")
          .select("message, figma_created_at")
          .eq("file_key", file.file_key)
          .order("figma_created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          id: file.id,
          file_key: file.file_key,
          file_name: file.file_name,
          file_url: file.file_url,
          thumbnail_url: file.thumbnail_url,
          total_comments: totalComments || 0,
          unread_count: unreadCount,
          last_comment_preview: lastComment?.message
            ? lastComment.message.substring(0, 50) + "..."
            : null,
          last_activity: lastComment?.figma_created_at || file.updated_at,
          created_at: file.created_at,
        };
      })
    );

    // 3. Overview 통계
    const overview = {
      total_files: filesWithStats.length,
      unread_comments: filesWithStats.reduce(
        (sum, f) => sum + f.unread_count,
        0
      ),
      last_activity:
        filesWithStats.length > 0
          ? filesWithStats[0].last_activity
          : null,
    };

    return NextResponse.json({
      overview,
      files: filesWithStats,
    });
  } catch (error) {
    console.error("[Figma Files GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch files",
      },
      { status: 500 }
    );
  }
}

/**
 * Figma 파일 URL에서 File Key 추출
 */
function extractFileKey(url: string): string {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error("Invalid Figma URL");
  return match[1];
}

/**
 * POST /api/figma/files
 * 새 Figma 파일 등록
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, workspaceId } = await request.json();

    if (!fileUrl || !workspaceId) {
      return NextResponse.json(
        { error: "fileUrl and workspaceId are required" },
        { status: 400 }
      );
    }

    const fileKey = extractFileKey(fileUrl);
    console.log("[Figma Files POST] File key extracted:", fileKey);

    // 1. Access token 가져오기
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(user.id);
      console.log("[Figma Files POST] Access token retrieved successfully");
    } catch (error) {
      console.error("[Figma Files POST] Token error:", error);
      return NextResponse.json(
        {
          error: "Figma 연동이 필요합니다. /profile/settings에서 연동해주세요.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 403 }
      );
    }

    // 2. Figma 파일 정보 조회
    console.log("[Figma Files POST] Fetching Figma file info...");
    console.log("[Figma Files POST] File URL:", `https://api.figma.com/v1/files/${fileKey}`);
    console.log("[Figma Files POST] Access token (first 20 chars):", accessToken.substring(0, 20) + "...");
    
    const fileRes = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "X-Figma-Token": accessToken, // 추가 헤더 (일부 API에서 요구)
      },
    });

    console.log("[Figma Files POST] Figma API response status:", fileRes.status);
    console.log("[Figma Files POST] Response headers:", Object.fromEntries(fileRes.headers.entries()));

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      console.error("[Figma Files POST] Figma API error:", errorText);
      console.error("[Figma Files POST] File key:", fileKey);
      
      // 에러 타입 파싱
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { status: fileRes.status, err: errorText };
      }

      // 403: 권한 없음
      if (fileRes.status === 403) {
        console.error("[Figma Files POST] 해결 방법: 1) Figma에서 파일을 열 수 있는지 확인 2) 파일이 공유되어 있는지 확인 3) OAuth 재연동");
        return NextResponse.json(
          {
            error: "파일 접근 권한이 없습니다",
            errorType: "ACCESS_DENIED",
            suggestions: [
              "이 파일은 비공개 파일이거나 본인에게 공유되지 않았습니다",
              "Figma에서 파일을 직접 열 수 있는지 확인해주세요",
              "파일 소유자에게 Edit 또는 View 권한을 요청하세요",
              "OAuth 앱이 Development 모드라면 본인이 만든 파일만 추가 가능합니다"
            ],
            details: errorData,
          },
          { status: 403 }
        );
      }
      
      // 404: 파일 없음
      if (fileRes.status === 404) {
        return NextResponse.json(
          {
            error: "파일을 찾을 수 없습니다",
            errorType: "NOT_FOUND",
            suggestions: ["URL이 올바른지 확인해주세요", "파일이 삭제되었을 수 있습니다"],
          },
          { status: 404 }
        );
      }

      // 기타 에러
      return NextResponse.json(
        {
          error: "Figma API 오류",
          errorType: "API_ERROR",
          details: errorData,
        },
        { status: fileRes.status }
      );
    }

    const fileData = await fileRes.json();
    console.log("[Figma Files POST] File loaded:", fileData.name);

    // 3. 썸네일 생성 (파일 전체를 0.25 스케일로)
    const thumbnailRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?format=png&scale=0.25`,
      { headers: { Authorization: `Bearer ${accessToken}` }}
    );

    const thumbnailData = await thumbnailRes.json();
    const thumbnailUrl = thumbnailData.images?.["0:0"] || null;

    // 4. 댓글 권한 확인
    let hasCommentAccess = false;
    try {
      console.log("[Figma Files POST] Checking comment access...");
      const commentsRes = await fetch(
        `https://api.figma.com/v1/files/${fileKey}/comments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      hasCommentAccess = commentsRes.ok;
      console.log("[Figma Files POST] Comment access:", hasCommentAccess);
    } catch (error) {
      console.log("[Figma Files POST] Comment check failed, assuming read-only");
    }

    // 5. Webhook 등록
    const passcode = crypto.randomBytes(32).toString("hex");
    let webhookId = null;

    try {
      const webhookRes = await fetch("https://api.figma.com/v2/webhooks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "FILE_COMMENT",
          team_id: fileData.team_id || fileData.project_id,
          passcode,
          endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/figma`,
          description: `Weekly Scrum - ${fileData.name}`,
        }),
      });

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json();
        webhookId = webhookData.id;
      } else {
        console.warn("[Figma Webhook] Failed to create webhook:", await webhookRes.text());
      }
    } catch (webhookError) {
      console.warn("[Figma Webhook] Error:", webhookError);
    }

    // 6. DB에 저장
    const { data: trackedFile, error: insertError } = await supabase
      .from("figma_tracked_files")
      .insert({
        workspace_id: workspaceId,
        file_key: fileKey,
        file_name: fileData.name,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        registered_by: user.id,
        webhook_id: webhookId,
        webhook_passcode: passcode,
        has_comment_access: hasCommentAccess,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("[Figma Files POST] File registered successfully with comment access:", hasCommentAccess);

    return NextResponse.json({
      file: trackedFile,
      message: "File registered successfully",
      has_comment_access: hasCommentAccess,
    });
  } catch (error) {
    console.error("[Figma Files POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to register file",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/figma/files?file_id=xxx
 * 파일 제거 (Webhook 해제 포함)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json(
        { error: "file_id is required" },
        { status: 400 }
      );
    }

    // 1. 파일 정보 조회
    const { data: file } = await supabase
      .from("figma_tracked_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 2. Webhook 해제
    if (file.webhook_id) {
      try {
        const accessToken = await getValidAccessToken(user.id);
        await fetch(`https://api.figma.com/v2/webhooks/${file.webhook_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (webhookError) {
        console.warn("[Figma Webhook DELETE] Error:", webhookError);
      }
    }

    // 3. DB에서 삭제 (CASCADE로 댓글도 자동 삭제)
    const { error: deleteError } = await supabase
      .from("figma_tracked_files")
      .delete()
      .eq("id", fileId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "File removed successfully" });
  } catch (error) {
    console.error("[Figma Files DELETE]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove file",
      },
      { status: 500 }
    );
  }
}

