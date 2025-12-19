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
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/feedbacks/${feedback.id}`}
      className="block group"
    >
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

        {/* 하단: 상태 + 릴리즈 */}
        <div className="flex items-center gap-2">
          <FeedbackStatusBadge status={feedback.status} />
          {feedback.status === "resolved" && feedback.release_version && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "#4f46e5",
              }}
            >
              {feedback.release_version}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

