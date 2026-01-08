/**
 * Figma 댓글 읽음 처리 API
 * POST: 특정 파일의 모든 댓글을 읽음 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/figma/files/[fileKey]/mark-read
 * 파일의 모든 댓글을 읽음 처리 (현재 사용자 기준)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileKey } = await params;

    // 1. 파일의 모든 댓글 조회
    const { data: comments, error: commentsError } = await supabase
      .from("figma_comments")
      .select("comment_id")
      .eq("file_key", fileKey);

    if (commentsError) throw commentsError;

    if (!comments || comments.length === 0) {
      return NextResponse.json({
        message: "No comments to mark as read",
        marked_count: 0,
      });
    }

    // 2. 읽음 상태 저장 (이미 존재하는 경우 무시)
    const reads = comments.map((comment) => ({
      user_id: user.id,
      comment_id: comment.comment_id,
    }));

    const { error: insertError } = await supabase
      .from("figma_comment_reads")
      .upsert(reads, { onConflict: "user_id,comment_id", ignoreDuplicates: true });

    if (insertError) throw insertError;

    return NextResponse.json({
      message: "Comments marked as read",
      marked_count: comments.length,
    });
  } catch (error) {
    console.error("[Figma Mark Read]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark comments as read",
      },
      { status: 500 }
    );
  }
}

