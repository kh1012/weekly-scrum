/**
 * Figma 파일 상세 정보 API
 * GET: 파일 정보 + 전체 댓글 (계층 구조)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Comment {
  id: string;
  comment_id: string;
  parent_id: string | null;
  user_handle: string;
  user_email: string | null;
  user_img_url: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  replies?: Comment[];
}

/**
 * GET /api/figma/files/[fileKey]
 * 파일 상세 정보 + 전체 댓글 (계층 구조)
 */
export async function GET(
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

    // 1. 파일 정보 조회
    const { data: file, error: fileError } = await supabase
      .from("figma_tracked_files")
      .select("*")
      .eq("file_key", fileKey)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 2. 등록자 정보 조회
    const { data: registeredByProfile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", file.registered_by)
      .single();

    // 3. 모든 댓글 조회
    const { data: allComments, error: commentsError } = await supabase
      .from("figma_comments")
      .select("*")
      .eq("file_key", fileKey)
      .order("figma_created_at", { ascending: true });

    if (commentsError) throw commentsError;

    // 4. 현재 사용자의 읽음 상태 조회
    const { data: readComments } = await supabase
      .from("figma_comment_reads")
      .select("comment_id")
      .eq("user_id", user.id);

    const readCommentIds = new Set(
      readComments?.map((r) => r.comment_id) || []
    );

    // 5. 댓글을 계층 구조로 변환
    const commentsMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    (allComments || []).forEach((comment) => {
      const commentObj: Comment = {
        id: comment.id,
        comment_id: comment.comment_id,
        parent_id: comment.parent_id,
        user_handle: comment.user_handle,
        user_email: comment.user_email,
        user_img_url: comment.user_img_url,
        message: comment.message,
        created_at: comment.figma_created_at,
        is_read: readCommentIds.has(comment.comment_id),
        replies: [],
      };

      commentsMap.set(comment.comment_id, commentObj);

      if (!comment.parent_id) {
        rootComments.push(commentObj);
      }
    });

    // 6. 대댓글을 부모에 연결
    commentsMap.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(comment);
        }
      }
    });

    // 7. 파일 정보 구성
    const fileInfo = {
      file_key: file.file_key,
      file_name: file.file_name,
      file_url: file.file_url,
      thumbnail_url: file.thumbnail_url,
      registered_by: registeredByProfile?.display_name || registeredByProfile?.email || "Unknown",
      created_at: file.created_at,
      updated_at: file.updated_at,
    };

    return NextResponse.json({
      file: fileInfo,
      comments: rootComments,
      total_comments: allComments?.length || 0,
    });
  } catch (error) {
    console.error("[Figma File Detail GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch file details",
      },
      { status: 500 }
    );
  }
}

