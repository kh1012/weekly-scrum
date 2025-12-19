/**
 * Feedback Kanban View
 * 클라이언트 컴포넌트 - 칸반 보드
 */

"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/common/Icons";
import { LoadingButton } from "@/components/common/LoadingButton";
import { FeedbackKanbanCard } from "./FeedbackKanbanCard";
import { CreateFeedbackModal } from "./CreateFeedbackModal";
import { EditFeedbackModal } from "./EditFeedbackModal";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import type { FeedbackWithDetails, FeedbackStatus } from "@/lib/data/feedback";

// 칸반 열 설정
const KANBAN_COLUMNS: {
  status: FeedbackStatus;
  label: string;
  color: string;
}[] = [
  {
    status: "open",
    label: "Open",
    color: "#64748b",
  },
  {
    status: "in_progress",
    label: "In Progress",
    color: "#3b82f6",
  },
  {
    status: "resolved",
    label: "Resolved",
    color: "#22c55e",
  },
];

interface FeedbackKanbanViewProps {
  feedbacks: FeedbackWithDetails[];
  isAdminOrLeader: boolean;
  currentUserId: string | null;
}

export function FeedbackKanbanView({
  feedbacks,
  isAdminOrLeader,
  currentUserId,
}: FeedbackKanbanViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] =
    useState<FeedbackWithDetails | null>(null);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(
    null
  );

  // 상태별로 그룹화
  const groupedFeedbacks = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.status] = feedbacks.filter((f) => f.status === col.status);
      return acc;
    }, {} as Record<FeedbackStatus, FeedbackWithDetails[]>);
  }, [feedbacks]);

  const handleFeedbackCreated = () => {
    setIsCreateModalOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleEditSuccess = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleDeleteSuccess = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // 카드에서 상태 변경
  const handleCardStatusChange = async (
    feedbackId: string,
    newStatus: FeedbackStatus
  ) => {
    setUpdatingFeedbackId(feedbackId);

    await updateFeedbackStatus(feedbackId, newStatus);

    startTransition(() => {
      router.refresh();
    });
  };

  // isPending이 false로 바뀌면 로딩 상태 해제
  useEffect(() => {
    if (!isPending && updatingFeedbackId) {
      setUpdatingFeedbackId(null);
    }
  }, [isPending, updatingFeedbackId]);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
      {/* 헤더 영역 */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 좌측: 타이틀 */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white"
                fill="currentColor"
                viewBox="0 0 640 512"
              >
                <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Feedbacks
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                {isAdminOrLeader
                  ? "모든 피드백을 관리할 수 있습니다"
                  : "내 피드백 목록"}
              </p>
            </div>
          </div>

          {/* 우측: 통계 + 액션 버튼 */}
          <div className="flex items-center gap-3">
            {/* 통계 뱃지 */}
            <div className="hidden md:flex items-center gap-2">
              {KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.status}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: `${col.color}15`,
                    color: col.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: col.color }}
                  />
                  {groupedFeedbacks[col.status]?.length || 0}
                </div>
              ))}
            </div>

            <div className="hidden md:block h-6 w-px bg-gray-200" />

            {/* New Feedback 버튼 */}
            <LoadingButton
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="md"
              icon={<PlusIcon className="w-4 h-4" />}
              className="group"
            >
              <span className="hidden sm:inline">New Feedback</span>
              <span className="sm:hidden">새 피드백</span>
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* 칸반 보드 영역 - Grid 레이아웃 */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        <div className="h-full grid grid-cols-3 gap-4 p-4 md:p-6">
          {KANBAN_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex flex-col rounded-xl overflow-hidden min-w-0"
            >
              {/* 열 헤더 */}
              <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ background: col.color }}
                  />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {col.label}
                  </h3>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${col.color}20`,
                    color: col.color,
                  }}
                >
                  {groupedFeedbacks[col.status]?.length || 0}
                </span>
              </div>

              {/* 카드 목록 */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {groupedFeedbacks[col.status]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg
                      className="w-8 h-8 mb-2 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-xs">피드백 없음</p>
                  </div>
                ) : (
                  groupedFeedbacks[col.status]?.map((feedback) => (
                    <FeedbackKanbanCard
                      key={feedback.id}
                      feedback={feedback}
                      color={col.color}
                      isAdminOrLeader={isAdminOrLeader}
                      currentUserId={currentUserId}
                      isUpdating={updatingFeedbackId === feedback.id}
                      onStatusChange={(newStatus) =>
                        handleCardStatusChange(feedback.id, newStatus)
                      }
                      onEditClick={() => setEditingFeedback(feedback)}
                      onDeleteSuccess={handleDeleteSuccess}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 빈 상태 오버레이 */}
      {feedbacks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              아직 피드백이 없습니다
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              첫 번째 피드백을 작성해보세요
            </p>
            <LoadingButton
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="md"
              icon={<PlusIcon className="w-4 h-4" />}
            >
              첫 피드백 작성하기
            </LoadingButton>
          </div>
        </div>
      )}

      {/* 새 피드백 모달 */}
      <CreateFeedbackModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleFeedbackCreated}
      />

      {/* 피드백 수정 모달 */}
      {editingFeedback && (
        <EditFeedbackModal
          isOpen={!!editingFeedback}
          onClose={() => setEditingFeedback(null)}
          onSuccess={handleEditSuccess}
          feedback={editingFeedback}
        />
      )}
    </div>
  );
}
