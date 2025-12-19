/**
 * Feedback Timeline
 * 상태 진행 타임라인
 */

"use client";

import { CheckIcon } from "@/components/common/Icons";
import type { FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackTimelineProps {
  currentStatus: FeedbackStatus;
}

const TIMELINE_STEPS: { status: FeedbackStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In Progress" },
  { status: "resolved", label: "Resolved" },
];

export function FeedbackTimeline({ currentStatus }: FeedbackTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.status} className="flex items-center flex-1">
              {/* 동그라미 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* 연결선 */}
              {index < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-200 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{ marginTop: "-20px" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

