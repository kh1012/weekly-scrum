/**
 * Resolve Panel
 * leader/admin 전용 해결 패널 - 해결내용 입력 UI
 */

"use client";

import { useState } from "react";
import { updateFeedbackStatus } from "@/app/actions/feedback";

interface ResolvePanelProps {
  feedbackId: string;
  onResolved: () => void;
}

const MAX_NOTE_LENGTH = 300;

export function ResolvePanel({
  feedbackId,
  onResolved,
}: ResolvePanelProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      setError("해결내용을 입력해주세요");
      return;
    }

    if (resolutionNote.length > MAX_NOTE_LENGTH) {
      setError(`해결내용은 ${MAX_NOTE_LENGTH}자 이내로 입력해주세요`);
      return;
    }

    const confirmed = confirm("이 피드백을 해결 완료로 표시하시겠습니까?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateFeedbackStatus(
      feedbackId,
      "resolved",
      {
        resolutionNote: resolutionNote.trim(),
      }
    );

    setIsSubmitting(false);

    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  const noteLength = resolutionNote.length;
  const isOverLimit = noteLength > MAX_NOTE_LENGTH;

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
      }}
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        피드백 완료 처리
      </h3>

      <div className="space-y-4">
        {/* 해결내용 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            해결내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={resolutionNote}
            onChange={(e) => {
              setResolutionNote(e.target.value);
              if (error) setError(null);
            }}
            placeholder="완료 처리 사유/해결 내용을 간단히 남겨주세요."
            rows={4}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none resize-none disabled:opacity-50 ${
              isOverLimit ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"
            }`}
            style={{
              background: "white",
              border: isOverLimit ? "1px solid #fca5a5" : "1px solid #e2e8f0",
            }}
          />
          <div className="mt-1.5 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              이 내용은 피드백 상세에 표시됩니다.
            </p>
            <span className={`text-xs ${isOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {noteLength}/{MAX_NOTE_LENGTH}
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#dc2626",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={handleResolve}
          disabled={isSubmitting || !resolutionNote.trim() || isOverLimit}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              처리 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              완료 처리
            </>
          )}
        </button>
      </div>
    </div>
  );
}
