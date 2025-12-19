/**
 * Feedback Timeline
 * 상태 진행 타임라인 - 모던 스테퍼 UI
 */

"use client";

import type { FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackTimelineProps {
  currentStatus: FeedbackStatus;
}

const TIMELINE_STEPS: { status: FeedbackStatus; label: string; color: string; icon: React.ReactNode }[] = [
  {
    status: "open",
    label: "Open",
    color: "#6b7280",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    status: "in_progress",
    label: "In Progress",
    color: "#3b82f6",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: "resolved",
    label: "Resolved",
    color: "#22c55e",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function FeedbackTimeline({ currentStatus }: FeedbackTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  return (
    <div className="relative">
      {/* 배경 연결선 */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-100" />

      {/* 진행된 연결선 */}
      <div
        className="absolute top-6 left-0 h-0.5 transition-all duration-500"
        style={{
          width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
          background: "linear-gradient(90deg, #6b7280 0%, #3b82f6 50%, #22c55e 100%)",
        }}
      />

      {/* 스텝들 */}
      <div className="relative flex items-start justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center" style={{ width: "33.33%" }}>
              {/* 아이콘 원 */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "shadow-lg scale-110"
                    : isCompleted
                    ? "shadow-md"
                    : "shadow-sm"
                }`}
                style={{
                  background: isPending
                    ? "#f1f5f9"
                    : isActive
                    ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`
                    : `${step.color}20`,
                  border: isPending ? "2px dashed #e2e8f0" : "none",
                  color: isPending ? "#94a3b8" : isActive ? "white" : step.color,
                }}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}

                {/* 활성 상태 펄스 애니메이션 */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: step.color }}
                  />
                )}
              </div>

              {/* 라벨 */}
              <div className="mt-3 text-center">
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isPending ? "text-gray-400" : ""
                  }`}
                  style={{ color: isPending ? "#94a3b8" : step.color }}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div
                    className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: `${step.color}15`,
                      color: step.color,
                    }}
                  >
                    현재 상태
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
