/**
 * Figma 파일 상세 페이지 (Client Component)
 * - GitHub PR 스타일
 * - 댓글 계층 구조 표시
 * - 댓글 작성/답글
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { CommentThread } from "../components/CommentThread";
import { CommentForm } from "../components/CommentForm";

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

interface FileInfo {
  file_key: string;
  file_name: string;
  file_url: string;
  thumbnail_url: string | null;
  registered_by: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  fileKey: string;
  userId: string;
}

export function FileDetailClient({ fileKey, userId }: Props) {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/figma/files/${fileKey}`);
      const data = await res.json();

      if (res.ok) {
        setFile(data.file);
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch file details:", error);
    } finally {
      setLoading(false);
    }
  };

  // 자동 읽음 처리
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch(`/api/figma/files/${fileKey}/mark-read`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    };

    if (fileKey) {
      fetchData();
      markAsRead();
    }
  }, [fileKey]);

  const handleCommentSubmit = async (message: string, parentId?: string) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/figma/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey, message, parentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      // 댓글 목록 새로고침
      await fetchData();
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <LogoLoadingSpinner
        title="파일 정보를 불러오는 중입니다"
        description="잠시만 기다려주세요."
        className="min-h-[400px]"
      />
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-[#57606a]">파일을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3">
      {/* 뒤로 가기 */}
      <Link
        href="/works/figma-files"
        className="inline-flex items-center gap-1 text-xs text-[#0079D3] hover:underline mb-2 font-medium"
      >
        ← Back to Files
      </Link>

      {/* 헤더 - Reddit 스타일 카드 */}
      <div className="bg-white border border-[#EDEFF1] rounded mb-3 overflow-hidden">
        <div className="px-3 py-2 border-b border-[#EDEFF1]">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-base font-semibold text-[#1A1A1B]">
              {file.file_name}
            </h1>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs font-bold text-white bg-[#0079D3] rounded-full hover:bg-[#0060B6] transition-colors whitespace-nowrap ml-2"
            >
              Open in Figma →
            </a>
          </div>
          <div className="text-xs text-[#8590A2]">
            {file.registered_by} · {formatRelativeTime(file.created_at)}
          </div>
        </div>

        {/* 댓글 카운트 */}
        <div className="px-3 py-1.5 bg-[#F8F9FA] border-b border-[#EDEFF1]">
          <span className="text-xs font-semibold text-[#1A1A1B]">
            💬 {comments.length} Comments
          </span>
        </div>

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#8590A2]">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          <div className="divide-y divide-[#EDEFF1]">
            {comments.map((comment) => (
              <CommentThread
                key={comment.comment_id}
                comment={comment}
                onReply={(parentId, message) =>
                  handleCommentSubmit(message, parentId)
                }
                submitting={submitting}
              />
            ))}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <div className="px-3 py-2 border-t border-[#EDEFF1]">
          <div className="text-xs font-medium text-[#1A1A1B] mb-1.5">
            Add a comment
          </div>
          <CommentForm
            onSubmit={(message) => handleCommentSubmit(message)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}

