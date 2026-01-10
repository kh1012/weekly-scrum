/**
 * Figma 파일 상세 페이지 (Client Component)
 * - 인스타그램 스타일 댓글
 * - 깔끔한 카드 레이아웃
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { InlineSpinner } from "@/components/weekly-scrum/common/InlineSpinner";
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
        className="min-h-[400px]"
      />
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-600">파일을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 뒤로 가기 */}
      <Link
        href="/works/figma-files"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-6 hover:underline transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로 돌아가기
      </Link>

      {/* 파일 정보 카드 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                {file.file_name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>{file.registered_by}</span>
                <span>•</span>
                <span>{formatRelativeTime(file.created_at)}</span>
              </div>
            </div>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
            >
              Figma에서 열기
            </a>
          </div>
        </div>

        {/* 댓글 헤더 */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            댓글 {comments.length}개
          </div>
        </div>

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-slate-600 mb-1">
              아직 댓글이 없습니다
            </p>
            <p className="text-xs text-slate-500">
              첫 번째 댓글을 작성해보세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm font-medium text-slate-700 mb-3">
            댓글 작성
          </div>
          <CommentForm
            onSubmit={(message) => handleCommentSubmit(message)}
            submitting={submitting}
            placeholder="댓글을 입력하세요..."
          />
        </div>
      </div>
    </div>
  );
}
