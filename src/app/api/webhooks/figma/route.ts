/**
 * Figma Webhook 수신 엔드포인트
 * POST: Figma에서 댓글 이벤트를 실시간으로 수신
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FigmaWebhookPayload {
  passcode: string;
  webhook_id: string;
  event_type: string;
  file_key: string;
  file_name: string;
  timestamp: string;
  triggered_by: {
    id: string;
    handle: string;
    img_url?: string;
    email?: string;
  };
  comment?: {
    id: string;
    parent_id?: string;
    message: string;
    file_key: string;
    created_at: string;
    user: {
      handle: string;
      img_url?: string;
      email?: string;
    };
  };
}

/**
 * POST /api/webhooks/figma
 * Figma Webhook 이벤트 수신
 */
export async function POST(request: NextRequest) {
  try {
    const payload: FigmaWebhookPayload = await request.json();

    console.log("[Figma Webhook] Received:", {
      event_type: payload.event_type,
      file_key: payload.file_key,
      webhook_id: payload.webhook_id,
    });

    // 1. Passcode 검증
    const supabase = await createClient();
    const { data: file, error: fileError } = await supabase
      .from("figma_tracked_files")
      .select("webhook_passcode, webhook_id")
      .eq("file_key", payload.file_key)
      .single();

    if (fileError || !file) {
      console.error("[Figma Webhook] File not found:", payload.file_key);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (payload.passcode !== file.webhook_passcode) {
      console.error("[Figma Webhook] Invalid passcode");
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 401 }
      );
    }

    // 2. FILE_COMMENT 이벤트 처리
    if (payload.event_type === "FILE_COMMENT" && payload.comment) {
      const comment = payload.comment;

      // DB에 댓글 저장 (upsert: 이미 있으면 업데이트)
      const { error: commentError } = await supabase
        .from("figma_comments")
        .upsert(
          {
            file_key: payload.file_key,
            comment_id: comment.id,
            parent_id: comment.parent_id || null,
            user_handle: comment.user.handle,
            user_email: comment.user.email || null,
            user_img_url: comment.user.img_url || null,
            message: comment.message,
            figma_created_at: comment.created_at,
          },
          { onConflict: "comment_id" }
        );

      if (commentError) {
        console.error("[Figma Webhook] Comment save error:", commentError);
        throw commentError;
      }

      // 파일의 updated_at 갱신
      await supabase
        .from("figma_tracked_files")
        .update({ updated_at: new Date().toISOString() })
        .eq("file_key", payload.file_key);

      console.log("[Figma Webhook] Comment saved:", comment.id);
    }

    return NextResponse.json({
      received: true,
      event_type: payload.event_type,
    });
  } catch (error) {
    console.error("[Figma Webhook] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

