/**
 * Figma 댓글 API
 * POST: 댓글 작성 (Figma API 호출 + DB 캐시)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/figma/tokenManager";

/**
 * POST /api/figma/comments
 * 댓글 작성 (답글 포함)
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

    const { fileKey, message, parentId } = await request.json();

    if (!fileKey || !message) {
      return NextResponse.json(
        { error: "fileKey and message are required" },
        { status: 400 }
      );
    }

    // 1. Access token 가져오기
    const accessToken = await getValidAccessToken(user.id);

    // 2. Figma API로 댓글 작성
    const figmaPayload: any = {
      message,
    };

    // 답글인 경우 parent_comment_id 전달 (Figma API 문서 기준)
    if (parentId) {
      figmaPayload.parent_comment_id = parentId;
    }

    console.log("[Figma Comment POST] Payload:", JSON.stringify(figmaPayload));
    console.log("[Figma Comment POST] File key:", fileKey);

    const figmaRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(figmaPayload),
      }
    );

    console.log("[Figma Comment POST] Response status:", figmaRes.status);

    if (!figmaRes.ok) {
      const errorText = await figmaRes.text();
      console.error("[Figma Comment POST] Error:", errorText);
      console.error("[Figma Comment POST] Parent ID:", parentId);
      return NextResponse.json(
        { 
          error: "Failed to post comment to Figma",
          details: errorText,
          parentId: parentId 
        },
        { status: figmaRes.status }
      );
    }

    const figmaComment = await figmaRes.json();

    // 3. DB에 캐시
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    const { data: cachedComment, error: cacheError } = await supabase
      .from("figma_comments")
      .insert({
        file_key: fileKey,
        comment_id: figmaComment.id,
        parent_id: parentId || null,
        user_handle: profile?.display_name || profile?.email || "Unknown",
        user_email: profile?.email,
        user_img_url: null, // Figma에서 제공하지 않음
        message: figmaComment.message,
        figma_created_at: figmaComment.created_at,
      })
      .select()
      .single();

    if (cacheError) {
      console.warn("[Figma Comment Cache] Error:", cacheError);
    }

    return NextResponse.json({
      comment: cachedComment || figmaComment,
      message: "Comment posted successfully",
    });
  } catch (error) {
    console.error("[Figma Comments POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to post comment",
      },
      { status: 500 }
    );
  }
}

