/**
 * Feedback Kanban Card
 * 칸반 보드용 카드 컴포넌트 - 프로그래스바 처리 포함
 */

"use client";

import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import type { FeedbackWithDetails } from "@/lib/data/feedback";

interface FeedbackKanbanCardProps {
  feedback: FeedbackWithDetails;
  color: string;
}

export function FeedbackKanbanCard({ feedback, color }: FeedbackKanbanCardProps) {
  const router = useRouter();

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleClick = () => {
    navigationProgress.start();
    router.push(`/feedbacks/${feedback.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-lg p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-white"
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
        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: color }}
          >
            {feedback.author_name?.charAt(0) || "?"}
          </span>
          <span className="font-medium">{feedback.author_name}</span>
        </div>
        <span>{createdAt}</span>
      </div>

      {/* 릴리즈 버전 (resolved인 경우) */}
      {feedback.status === "resolved" && feedback.release_version && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              color: "#4f46e5",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {feedback.release_version}
          </span>
        </div>
      )}
    </div>
  );
}

