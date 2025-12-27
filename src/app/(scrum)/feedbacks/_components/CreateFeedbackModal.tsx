/**
 * Create Feedback Modal - GitHub Style
 * 피드백 작성 모달 - 빠른 입력
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { createFeedback } from "@/app/actions/feedback";
import { XIcon } from "@/components/common/Icons";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFeedbackModal({ isOpen, onClose, onSuccess }: CreateFeedbackModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때 제목에 포커스
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setError(null);
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createFeedback({
      title: title.trim() || undefined,
      content: content.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "피드백 생성에 실패했습니다");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 - GitHub 스타일 */}
      <div
        className="absolute inset-0"
        style={{ background: "#c8d1da66" }}
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative w-full max-w-lg bg-white border border-[#d0d7de] rounded-md overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] border-b border-[#d0d7de]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#0969da] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 640 512">
                <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[#24292f]">New Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#d0d7de] transition-colors"
          >
            <XIcon className="w-5 h-5 text-[#57606a]" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-[#24292f] mb-2">
              제목
              <span className="ml-1.5 text-xs font-normal text-[#57606a]">(선택)</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="간단한 제목을 입력하세요"
              className="w-full px-3 py-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#24292f] transition-colors outline-none focus:border-[#0969da] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.1)]"
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-[#24292f] mb-2">
              내용 <span className="text-[#cf222e]">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="피드백 내용을 자세히 작성해주세요..."
              rows={5}
              className="w-full px-3 py-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#24292f] transition-colors outline-none resize-none focus:border-[#0969da] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.1)]"
              disabled={isSubmitting}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="px-3 py-2 bg-[#ffebe9] border border-[#ff8182] rounded-md text-sm text-[#cf222e] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#24292f] bg-[#f6f8fa] border border-[#d0d7de] rounded-md hover:bg-[#f3f4f6] transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0969da] rounded-md hover:bg-[#0860ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  제출 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  제출
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
