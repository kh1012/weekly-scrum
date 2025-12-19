/**
 * Feedback Kanban Card
 * 칸반 보드용 심플 카드 컴포넌트
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { LoadingButton } from "@/components/common/LoadingButton";
import type { FeedbackWithDetails, FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackKanbanCardProps {
  feedback: FeedbackWithDetails;
  color: string;
  isAdminOrLeader: boolean;
  isUpdating?: boolean;
  onClick: () => void;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
}

export function FeedbackKanbanCard({
  feedback,
  color,
  isAdminOrLeader,
  isUpdating = false,
  onClick,
  onStatusChange,
}: FeedbackKanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // 상태 버튼 클릭
  const handleStatusClick = (
    e: React.MouseEvent,
    newStatus: FeedbackStatus
  ) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onStatusChange && !isUpdating) {
      onStatusChange(newStatus);
    }
  };

  // 메뉴 토글
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpdating) {
      setShowMenu(!showMenu);
    }
  };

  // 상태별 메뉴 옵션
  const getMenuOptions = () => {
    switch (feedback.status) {
      case "open":
        return [
          {
            label: "진행하기",
            status: "in_progress" as FeedbackStatus,
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            ),
            color: "#3b82f6",
          },
        ];

      case "in_progress":
        return [
          {
            label: "열기",
            status: "open" as FeedbackStatus,
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ),
            color: "#64748b",
          },
          {
            label: "완료",
            status: "resolved" as FeedbackStatus,
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ),
            color: "#22c55e",
          },
        ];

      case "resolved":
        return [
          {
            label: "다시 열기",
            status: "in_progress" as FeedbackStatus,
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ),
            color: "#64748b",
          },
        ];

      default:
        return [];
    }
  };

  const menuOptions = getMenuOptions();

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] rounded-xl"
    >
      {/* 심플 카드 */}
      <div
        className="relative rounded-xl p-4 bg-white"
        style={{
          border: `1px solid ${color}50`,
          boxShadow: `0 1px 3px ${color}10`,
        }}
      >
        {/* 상태 옵션 메뉴 */}
        {isAdminOrLeader && (
          <div ref={menuRef} className="absolute top-2 right-2">
            <button
              onClick={handleMenuToggle}
              disabled={isUpdating}
              className={`p-1.5 rounded-lg transition-colors ${
                isUpdating 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-gray-100 active:scale-95"
              }`}
            >
              {isUpdating ? (
                <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              )}
            </button>

            {/* 드롭다운 메뉴 */}
            {showMenu && !isUpdating && (
              <div 
                className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {menuOptions.map((option) => (
                  <button
                    key={option.status}
                    onClick={(e) => handleStatusClick(e, option.status)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span style={{ color: option.color }}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div>
          {/* 제목 */}
          <h4 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 pr-8 group-hover:text-blue-600 transition-colors">
            {feedback.title || feedback.content.substring(0, 40) + "..."}
          </h4>

          {/* 내용 미리보기 */}
          {feedback.title && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {feedback.content.substring(0, 60)}...
            </p>
          )}

          {/* 하단: 작성자 + 날짜 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: color }}
              >
                {feedback.author_name?.charAt(0) || "?"}
              </span>
              <span className="text-xs text-gray-600">
                {feedback.author_name}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">{createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
