/**
 * 댓글 작성 폼 (인스타그램 스타일)
 * - 컴팩트한 디자인
 * - 자동 확장 textarea
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { InlineSpinner } from "@/components/weekly-scrum/common/InlineSpinner";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    await onSubmit(message);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-h-[36px] max-h-[120px] px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
        disabled={submitting}
        rows={1}
      />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            disabled={submitting}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          disabled={submitting || !message.trim()}
          aria-busy={submitting}
        >
          {submitting && <InlineSpinner size={12} />}
          {submitting ? "작성 중..." : "게시"}
        </button>
      </div>
    </form>
  );
}
