/**
 * New Feedback Page
 * 피드백 작성 페이지
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFeedback } from "@/app/actions/feedback";
import { XIcon } from "@/components/common/Icons";

export default function NewFeedbackPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/feedbacks/${result.feedbackId}`);
    } else {
      setError(result.error || "피드백 생성에 실패했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">New Feedback</h1>
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-150 active:scale-95"
            >
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl p-6"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    (선택)
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="간단한 제목을 입력하세요"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#1e293b",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="피드백 내용을 자세히 작성해주세요"
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none resize-none"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#1e293b",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#dc2626",
                  }}
                >
                  {error}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 active:scale-95 hover:bg-gray-100"
                  style={{ color: "#64748b" }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  }}
                >
                  {isSubmitting ? "제출 중..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

