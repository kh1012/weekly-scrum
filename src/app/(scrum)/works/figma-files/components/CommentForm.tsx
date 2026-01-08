/**
 * 댓글 작성 폼 (GitHub 스타일)
 */

"use client";

import { useState } from "react";

interface Props {
  onSubmit: (message: string) => Promise<void>;
  submitting: boolean;
  placeholder?: string;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  submitting,
  placeholder = "댓글을 입력하세요...",
  onCancel,
}: Props) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    await onSubmit(message);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-[#EDEFF1] rounded bg-white overflow-hidden">
        {/* Textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[60px] p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={submitting}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-1.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs font-bold text-[#1A1A1B] bg-white border border-[#EDEFF1] rounded-full hover:bg-[#f6f8fa] transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-3 py-1 text-xs font-bold text-white bg-[#0079D3] rounded-full hover:bg-[#0060B6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={submitting || !message.trim()}
        >
          {submitting ? "..." : "Comment"}
        </button>
      </div>
    </form>
  );
}

