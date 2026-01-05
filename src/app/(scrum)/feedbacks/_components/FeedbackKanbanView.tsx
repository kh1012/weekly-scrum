/**
 * Feedback Kanban View
 * 클라이언트 컴포넌트 - 칸반 보드
 */

"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/common/Icons";
import { LoadingButton } from "@/components/common/LoadingButton";
import { FeedbackKanbanCard } from "./FeedbackKanbanCard";
import { CreateFeedbackModal } from "./CreateFeedbackModal";
import { EditFeedbackModal } from "./EditFeedbackModal";
import { ResolvePanel } from "@/components/feedback/ResolvePanel";
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
  isAdminOrManager: boolean;
  currentUserId: string | null;
}

export function FeedbackKanbanView({
  feedbacks,
  isAdminOrManager,
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
  // Resolve 모달 상태
  const [resolvingFeedbackId, setResolvingFeedbackId] = useState<string | null>(
    null
  );

  // 상태별로 그룹화 및 최신순 정렬
  const groupedFeedbacks = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.status] = feedbacks
        .filter((f) => f.status === col.status)
        .sort((a, b) => {
          // created_at 기준 내림차순 (최신이 위로)
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
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
    // resolved로 변경 시 모달 열기 (해결내용 입력 필요)
    if (newStatus === "resolved") {
      setResolvingFeedbackId(feedbackId);
      return;
    }

    setUpdatingFeedbackId(feedbackId);

    try {
      // 최소 300ms 로딩 표시 보장 (사용자 피드백 개선)
      await Promise.all([
        updateFeedbackStatus(feedbackId, newStatus),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);

      // 상태 업데이트 후 새로고침
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update feedback status:", error);
      setUpdatingFeedbackId(null);
      alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      // 성공 여부와 관계없이 로딩 상태 해제
      // router.refresh() 후 컴포넌트가 다시 렌더링되므로 약간의 지연 후 해제
      setTimeout(() => {
        setUpdatingFeedbackId(null);
      }, 100);
    }
  };

  // Resolve 모달에서 완료 처리 성공 시
  const handleResolveSuccess = () => {
    setResolvingFeedbackId(null);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col bg-white">
      {/* 헤더 영역 - GitHub 스타일 */}
      <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 bg-transparent border-b border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* 좌측: 타이틀 */}
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[#57606a]"
              fill="currentColor"
              viewBox="0 0 640 512"
            >
              <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
            </svg>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-[#24292f]">
                Feedbacks
              </h1>
              <p className="text-xs text-[#57606a] mt-0.5">
                {isAdminOrManager
                  ? "모든 피드백을 관리할 수 있습니다"
                  : "내 피드백 목록"}
              </p>
            </div>
          </div>

          {/* 우측: 통계 + 액션 버튼 */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 통계 뱃지 */}
            <div className="hidden sm:flex items-center gap-2">
              {KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.status}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#57606a]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: col.color }}
                  />
                  {groupedFeedbacks[col.status]?.length || 0}
                </div>
              ))}
            </div>

            <div className="hidden sm:block h-5 w-px bg-[#d0d7de]" />

            {/* New Feedback 버튼 - GitHub 스타일 */}
            <LoadingButton
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="sm"
              icon={<PlusIcon className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">New feedback</span>
              <span className="sm:hidden">새 피드백</span>
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* 칸반 보드 영역 - Grid 레이아웃 */}
      <div className="bg-white pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4">
          {KANBAN_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex flex-col bg-white border border-[#d0d7de] rounded-md overflow-hidden"
              style={{ minHeight: "400px" }}
            >
              {/* 열 헤더 - GitHub 스타일 */}
              <div className="shrink-0 px-3 py-2 bg-white border-b border-[#d0d7de] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: col.color }}
                  />
                  <h3 className="font-semibold text-[#24292f] text-sm">
                    {col.label}
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium text-[#57606a] bg-[#f6f8fa] border border-[#d0d7de] rounded-xl">
                  {groupedFeedbacks[col.status]?.length || 0}
                </span>
              </div>

              {/* 카드 목록 */}
              <div className="p-2 space-y-2">
                {groupedFeedbacks[col.status]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#57606a]">
                    <svg
                      className="w-6 h-6 mb-2 opacity-40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
                      isAdminOrManager={isAdminOrManager}
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

      {/* 빈 상태 - GitHub 스타일 */}
      {feedbacks.length === 0 && (
        <div className="p-12 flex items-center justify-center bg-white">
          <div className="text-center px-4">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-[#57606a] opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-base font-semibold text-[#24292f] mb-1">
              아직 피드백이 없습니다
            </h3>
            <p className="text-sm text-[#57606a] mb-4">
              첫 번째 피드백을 작성해보세요
            </p>
            <LoadingButton
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="sm"
              icon={<PlusIcon className="w-3.5 h-3.5" />}
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

      {/* 피드백 완료 처리 모달 - GitHub 스타일 */}
      {resolvingFeedbackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setResolvingFeedbackId(null)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative w-full max-w-md bg-white border border-[#d0d7de] rounded-md">
            {/* 헤더 */}
            <div className="px-4 py-3 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#24292f]">
                피드백 완료 처리
              </h2>
              <button
                onClick={() => setResolvingFeedbackId(null)}
                className="p-1 text-[#57606a] hover:text-[#24292f] hover:bg-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4">
              <ResolvePanel
                feedbackId={resolvingFeedbackId}
                onResolved={handleResolveSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
