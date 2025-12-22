/**
 * Feedback Card
 * Airbnb listing 스타일의 피드백 카드
 */

"use client";

import Link from "next/link";
import { FeedbackStatusBadge } from "./FeedbackStatusBadge";
import type { FeedbackWithDetails } from "@/lib/data/feedback";

interface FeedbackCardProps {
  feedback: FeedbackWithDetails;
  /** 칸반 뷰용 컴팩트 모드 */
  compact?: boolean;
}

export function FeedbackCard({ feedback, compact = false }: FeedbackCardProps) {
  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (compact) {
    return (
      <Link href={`/feedbacks/${feedback.id}`} className="block group">
        <div
          className="rounded-lg p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-white"
          style={{ border: "1px solid rgba(0, 0, 0, 0.06)" }}
        >
          {/* 제목 */}
          <h4 className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {feedback.title || feedback.content.substring(0, 40) + "..."}
          </h4>

          {/* 내용 미리보기 */}
          {feedback.title && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {feedback.content.substring(0, 60)}...
            </p>
          )}

          {/* 하단: 작성자 + 날짜 */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium">{feedback.author_name}</span>
            <span>{createdAt}</span>
          </div>

          {/* 해결 내용 (resolved인 경우) */}
          {feedback.status === "resolved" && feedback.resolution_note && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "#16a34a",
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                해결됨
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // 기본 카드 (그리드 뷰)
  return (
    <Link href={`/feedbacks/${feedback.id}`} className="block group">
      <div
        className="rounded-xl p-5 transition-all duration-200 hover:shadow-md"
        style={{
          background: "white",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* 상단: 제목 또는 내용 요약 */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {feedback.title || feedback.content.substring(0, 50) + "..."}
        </h3>

        {/* 중단: 메타 정보 */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span>{feedback.author_name}</span>
          <span>•</span>
          <span>{createdAt}</span>
        </div>

        {/* 하단: 상태 */}
        <div className="flex items-center gap-2">
          <FeedbackStatusBadge status={feedback.status} />
          {feedback.status === "resolved" && feedback.resolution_note && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
              }}
            >
              해결됨
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
