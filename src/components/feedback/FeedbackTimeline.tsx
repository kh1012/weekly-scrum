/**
 * Feedback Timeline
 * 상태 진행 타임라인 - 버튼 형태로 상태 변경 가능
 */

"use client";

import type { FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackTimelineProps {
  currentStatus: FeedbackStatus;
  /** 상태 변경 가능 여부 (admin/leader만) */
  canChangeStatus?: boolean;
  /** 상태 변경 콜백 */
  onStatusChange?: (newStatus: FeedbackStatus) => void;
  /** 상태 변경 중 */
  isUpdating?: boolean;
}

const TIMELINE_STEPS: { status: FeedbackStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In Progress" },
  { status: "resolved", label: "Resolved" },
];

export function FeedbackTimeline({
  currentStatus,
  canChangeStatus = false,
  onStatusChange,
  isUpdating = false,
}: FeedbackTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  const handleStepClick = (status: FeedbackStatus, index: number) => {
    if (!canChangeStatus || !onStatusChange || isUpdating) return;
    // resolved는 ResolvePanel에서만 변경 가능
    if (status === "resolved") return;
    // 이미 현재 상태면 무시
    if (status === currentStatus) return;
    onStatusChange(status);
  };

  return (
    <div className="relative py-4">
      {/* 배경 연결선 (파란색 단색) */}
      <div
        className="absolute top-[calc(50%-4px)] left-0 right-0 h-1 rounded-full"
        style={{ background: "#e2e8f0" }}
      />

      {/* 진행된 연결선 (파란색) */}
      <div
        className="absolute top-[calc(50%-4px)] left-0 h-1 rounded-full transition-all duration-500"
        style={{
          width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
          background: "#3b82f6",
        }}
      />

      {/* 스텝들 */}
      <div className="relative flex items-center justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;
          const isClickable = canChangeStatus && step.status !== "resolved" && step.status !== currentStatus;

          return (
            <div key={step.status} className="flex flex-col items-center" style={{ width: "33.33%" }}>
              {/* 버튼/원 */}
              <button
                type="button"
                onClick={() => handleStepClick(step.status, index)}
                disabled={!isClickable || isUpdating}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isClickable && !isUpdating
                    ? "cursor-pointer hover:scale-110 hover:shadow-lg"
                    : step.status === "resolved"
                    ? "cursor-not-allowed"
                    : "cursor-default"
                } ${isActive ? "shadow-lg scale-110" : isCompleted ? "shadow-md" : "shadow-sm"}`}
                style={{
                  background: isPending
                    ? "#f1f5f9"
                    : isActive || isCompleted
                    ? "#3b82f6"
                    : "#f1f5f9",
                  border: isPending ? "2px dashed #cbd5e1" : "none",
                  color: isPending ? "#94a3b8" : "white",
                }}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}

                {/* 활성 상태 펄스 애니메이션 */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-blue-500" />
                )}
              </button>

              {/* 라벨 */}
              <div className="mt-3 text-center">
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isClickable && !isUpdating ? "cursor-pointer hover:text-blue-600" : ""
                  }`}
                  style={{
                    color: isPending ? "#94a3b8" : "#3b82f6",
                  }}
                  onClick={() => handleStepClick(step.status, index)}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div
                    className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                    }}
                  >
                    현재 상태
                  </div>
                )}
                {isClickable && !isUpdating && (
                  <div className="mt-1 text-[10px] text-gray-400">클릭하여 변경</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
