/**
 * 댓글 스레드 컴포넌트 (인스타그램 스타일)
 * - 컴팩트한 디자인
 * - 계층 구조 표현
 */

"use client";

import { useState } from "react";
import { CommentForm } from "./CommentForm";

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

interface Props {
  comment: Comment;
  onReply: (parentId: string, message: string) => Promise<void>;
  submitting: boolean;
}

export function CommentThread({ comment, onReply, submitting }: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = async (message: string) => {
    await onReply(comment.comment_id, message);
    setShowReplyForm(false);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="comment-thread py-3">
      {/* 부모 댓글 */}
      <div className="flex gap-3 px-4">
        {/* 아바타 */}
        <div className="w-8 h-8 flex-shrink-0">
          {comment.user_img_url ? (
            <img
              src={comment.user_img_url}
              alt={comment.user_handle}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(comment.user_handle)}
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 + 메시지 */}
          <div className="mb-1">
            <span className="font-semibold text-sm text-slate-900 mr-2">
              {comment.user_handle}
            </span>
            <span className="text-sm text-slate-700 break-words">
              {comment.message}
            </span>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{formatRelativeTime(comment.created_at)}</span>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="font-semibold hover:text-slate-700 transition-colors"
            >
              답글 달기
            </button>
          </div>
        </div>
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-14 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.comment_id} className="flex gap-3 px-4">
              {/* 아바타 */}
              <div className="w-7 h-7 flex-shrink-0">
                {reply.user_img_url ? (
                  <img
                    src={reply.user_img_url}
                    alt={reply.user_handle}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(reply.user_handle)}
                  </div>
                )}
              </div>

              {/* 답글 내용 */}
              <div className="flex-1 min-w-0">
                {/* 사용자명 + 메시지 */}
                <div className="mb-1">
                  <span className="font-semibold text-sm text-slate-900 mr-2">
                    {reply.user_handle}
                  </span>
                  <span className="text-sm text-slate-700 break-words">
                    {reply.message}
                  </span>
                </div>

                {/* 시간 */}
                <div className="text-xs text-slate-500">
                  {formatRelativeTime(reply.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 답글 작성 폼 */}
      {showReplyForm && (
        <div className="mt-3 ml-14 px-4">
          <CommentForm
            onSubmit={handleReplySubmit}
            submitting={submitting}
            placeholder="답글을 입력하세요..."
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}
