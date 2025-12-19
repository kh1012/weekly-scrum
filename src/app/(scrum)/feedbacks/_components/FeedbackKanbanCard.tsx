/**
 * Feedback Kanban Card
 * 칸반 보드용 티켓 스타일 카드 컴포넌트
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { SmallLoadingSpinner } from "@/components/common/LoadingButton";
import type { FeedbackWithDetails } from "@/lib/data/feedback";

interface FeedbackKanbanCardProps {
  feedback: FeedbackWithDetails;
  color: string;
}

export function FeedbackKanbanCard({ feedback, color }: FeedbackKanbanCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  const handleClick = () => {
    setIsNavigating(true);
    navigationProgress.start();
    router.push(`/feedbacks/${feedback.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer transition-all duration-200 ${
        isNavigating 
          ? "scale-[0.97] opacity-80" 
          : "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
      }`}
    >
      {/* 티켓 카드 */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: "white",
          border: `2px solid ${color}30`,
          boxShadow: `0 2px 8px ${color}10`,
        }}
      >
        {/* 상단 컬러 바 */}
        <div
          className="h-1.5"
          style={{ background: color }}
        />

        {/* 티켓 홀 데코레이션 */}
        <div
          className="absolute top-0 left-4 w-3 h-3 rounded-full transform -translate-y-1/2"
          style={{ background: "#f1f5f9", border: `2px solid ${color}40` }}
        />
        <div
          className="absolute top-0 right-4 w-3 h-3 rounded-full transform -translate-y-1/2"
          style={{ background: "#f1f5f9", border: `2px solid ${color}40` }}
        />

        {/* 콘텐츠 */}
        <div className="p-4">
          {/* 로딩 오버레이 */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <SmallLoadingSpinner size="md" className="text-gray-500" />
            </div>
          )}

          {/* 제목 */}
          <h4
            className="text-sm font-semibold mb-2 line-clamp-2 transition-colors"
            style={{ color: "#1e293b" }}
          >
            <span
              className="group-hover:underline"
              style={{ textDecorationColor: color }}
            >
              {feedback.title || feedback.content.substring(0, 40) + "..."}
            </span>
          </h4>

          {/* 내용 미리보기 */}
          {feedback.title && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {feedback.content.substring(0, 60)}...
            </p>
          )}

          {/* 구분선 (점선) */}
          <div
            className="border-t border-dashed my-3"
            style={{ borderColor: `${color}30` }}
          />

          {/* 하단: 작성자 + 날짜 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: color }}
              >
                {feedback.author_name?.charAt(0) || "?"}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {feedback.author_name}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">{createdAt}</span>
          </div>

          {/* 릴리즈 버전 (resolved인 경우) */}
          {feedback.status === "resolved" && feedback.release_version && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  background: `${color}15`,
                  color: color,
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
      </div>
    </div>
  );
}
