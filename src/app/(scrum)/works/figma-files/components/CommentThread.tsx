/**
 * 댓글 스레드 컴포넌트 (GitHub PR 스타일)
 * - 부모 댓글 + 대댓글 계층 구조
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
    <div className="comment-thread">
      {/* 부모 댓글 */}
      <div className="flex gap-2 px-3 py-2">
        {/* 아바타 */}
        <div className="w-7 h-7 flex-shrink-0">
          {comment.user_img_url ? (
            <img
              src={comment.user_img_url}
              alt={comment.user_handle}
              className="w-full h-full rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#FF4500] flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(comment.user_handle)}
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-xs text-[#24292f]">
              {comment.user_handle}
            </span>
            <span className="text-xs text-[#8590A2]">
              · {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          {/* 내용 */}
          <div className="text-sm text-[#1A1A1B] leading-relaxed mb-1 whitespace-pre-wrap break-words">
            {comment.message}
          </div>

          {/* 액션 */}
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs font-semibold text-[#8590A2] hover:bg-[#f6f8fa] px-1.5 py-0.5 rounded transition-colors"
          >
            ↩ Reply
          </button>
        </div>
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 border-l-2 border-[#EDEFF1] pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.comment_id} className="flex gap-2 py-2">
              {/* 아바타 */}
              <div className="w-6 h-6 flex-shrink-0">
                {reply.user_img_url ? (
                  <img
                    src={reply.user_img_url}
                    alt={reply.user_handle}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0079D3] flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(reply.user_handle)}
                  </div>
                )}
              </div>

              {/* 답글 내용 */}
              <div className="flex-1 min-w-0">
                {/* 헤더 */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-xs text-[#24292f]">
                    {reply.user_handle}
                  </span>
                  <span className="text-xs text-[#8590A2]">
                    · {formatRelativeTime(reply.created_at)}
                  </span>
                </div>

                {/* 내용 */}
                <div className="text-sm text-[#1A1A1B] leading-relaxed whitespace-pre-wrap break-words">
                  {reply.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 답글 작성 폼 */}
      {showReplyForm && (
        <div className="ml-9 px-3 py-2">
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

