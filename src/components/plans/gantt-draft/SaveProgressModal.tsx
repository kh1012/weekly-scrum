/**
 * Save Progress Modal
 * - Flag 영역과 기능 영역 저장 진행 상태 표시
 * - 프로그래스바로 API Call 상태 표현
 * - 오류 발생 시 하단에 오류 표시
 */

"use client";

import { CheckIcon, XIcon, LoadingIcon } from "@/components/common/Icons";

export type SaveStepStatus = "pending" | "in_progress" | "success" | "error";

export interface SaveStep {
  id: string;
  label: string;
  status: SaveStepStatus;
  count?: number;
  error?: string;
}

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: SaveStep[];
  isComplete: boolean;
}

export function SaveProgressModal({
  isOpen,
  onClose,
  steps,
  isComplete,
}: SaveProgressModalProps) {
  if (!isOpen) return null;

  // 전체 진행률 계산
  const completedSteps = steps.filter(
    (s) => s.status === "success" || s.status === "error"
  ).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  // 오류가 있는지 확인
  const hasError = steps.some((s) => s.status === "error");

  // 모든 작업 완료 여부
  const allComplete = steps.every(
    (s) => s.status === "success" || s.status === "error"
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isComplete ? onClose : undefined}
      />

      {/* 모달 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: 420,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* 헤더 */}
        <div
          className="px-6 py-5"
          style={{
            background: hasError
              ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
              : allComplete
              ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
              : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* 상태 아이콘 */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: hasError
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : allComplete
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              }}
            >
              {hasError ? (
                <XIcon className="w-5 h-5 text-white" />
              ) : allComplete ? (
                <CheckIcon className="w-5 h-5 text-white" />
              ) : (
                <LoadingIcon className="w-5 h-5 text-white animate-spin" />
              )}
            </div>

            {/* 제목 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {hasError
                  ? "저장 중 오류 발생"
                  : allComplete
                  ? "저장 완료"
                  : "저장 중..."}
              </h3>
              <p className="text-sm text-gray-500">
                {hasError
                  ? "일부 항목 저장에 실패했습니다"
                  : allComplete
                  ? "모든 변경사항이 저장되었습니다"
                  : "변경사항을 서버에 저장하고 있습니다"}
              </p>
            </div>
          </div>
        </div>

        {/* 전체 프로그래스바 */}
        <div className="px-6 py-4" style={{ background: "rgba(0, 0, 0, 0.02)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">전체 진행률</span>
            <span className="text-xs font-bold text-gray-700">{progressPercent}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(0, 0, 0, 0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: hasError
                  ? "linear-gradient(90deg, #ef4444 0%, #f87171 100%)"
                  : "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
              }}
            />
          </div>
        </div>

        {/* 단계별 상태 */}
        <div className="px-6 py-4 space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background:
                  step.status === "error"
                    ? "rgba(239, 68, 68, 0.08)"
                    : step.status === "success"
                    ? "rgba(16, 185, 129, 0.08)"
                    : step.status === "in_progress"
                    ? "rgba(59, 130, 246, 0.08)"
                    : "rgba(0, 0, 0, 0.02)",
                border:
                  step.status === "error"
                    ? "1px solid rgba(239, 68, 68, 0.2)"
                    : step.status === "success"
                    ? "1px solid rgba(16, 185, 129, 0.2)"
                    : step.status === "in_progress"
                    ? "1px solid rgba(59, 130, 246, 0.2)"
                    : "1px solid rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* 단계 아이콘 */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    step.status === "error"
                      ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      : step.status === "success"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : step.status === "in_progress"
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                      : "rgba(0, 0, 0, 0.1)",
                }}
              >
                {step.status === "error" ? (
                  <XIcon className="w-4 h-4 text-white" />
                ) : step.status === "success" ? (
                  <CheckIcon className="w-4 h-4 text-white" />
                ) : step.status === "in_progress" ? (
                  <LoadingIcon className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </div>

              {/* 단계 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      step.status === "error"
                        ? "text-red-700"
                        : step.status === "success"
                        ? "text-green-700"
                        : step.status === "in_progress"
                        ? "text-blue-700"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.count !== undefined && step.status === "success" && (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {step.count}개 저장됨
                    </span>
                  )}
                </div>

                {/* 오류 메시지 */}
                {step.status === "error" && step.error && (
                  <p className="text-xs text-red-600 mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div
          className="px-6 py-4"
          style={{
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            background: "rgba(0, 0, 0, 0.02)",
          }}
        >
          <button
            onClick={onClose}
            disabled={!isComplete}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              isComplete
                ? hasError
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "text-white hover:shadow-lg hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={
              isComplete && !hasError
                ? {
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                  }
                : {}
            }
          >
            {isComplete ? "확인" : "저장 중..."}
          </button>
        </div>
      </div>
    </div>
  );
}

