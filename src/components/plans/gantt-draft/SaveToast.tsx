/**
 * SaveToast - 저장 진행 상태를 표시하는 컴팩트 Toast
 * - 프로그래스바
 * - 단계별 상태 (Flags / Plans)
 * - 저장된 개수
 * - 에러 메시지
 */

"use client";

import { toast } from "sonner";
import {
  CheckIcon,
  XIcon,
  LoadingIcon,
  FlagIcon,
  CodeIcon,
} from "@/components/common/Icons";

export type SaveStepStatus = "pending" | "in_progress" | "success" | "error";

export interface SaveStep {
  id: string;
  label: string;
  status: SaveStepStatus;
  count?: number;
  error?: string;
}

export interface SaveToastState {
  steps: SaveStep[];
  isComplete: boolean;
  hasError: boolean;
}

interface SaveToastProps {
  state: SaveToastState;
  onDismiss: () => void;
  onRetry?: () => void;
}

/**
 * 전체 진행률 계산
 */
function calculateProgress(steps: SaveStep[]): number {
  if (steps.length === 0) return 0;

  let completed = 0;
  for (const step of steps) {
    if (step.status === "success" || step.status === "error") {
      completed += 1;
    } else if (step.status === "in_progress") {
      completed += 0.5;
    }
  }

  return Math.round((completed / steps.length) * 100);
}

/**
 * 상태별 아이콘
 */
function StepIcon({ status }: { status: SaveStepStatus }) {
  switch (status) {
    case "success":
      return (
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckIcon className="w-2.5 h-2.5 text-white" />
        </div>
      );
    case "error":
      return (
        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
          <XIcon className="w-2.5 h-2.5 text-white" />
        </div>
      );
    case "in_progress":
      return (
        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <LoadingIcon className="w-2.5 h-2.5 text-white animate-spin" />
        </div>
      );
    default:
      return (
        <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        </div>
      );
  }
}

/**
 * 단계별 라벨 아이콘
 */
function StepLabelIcon({ stepId }: { stepId: string }) {
  if (stepId === "flags") {
    return <FlagIcon className="w-3 h-3 text-white/60" />;
  }
  return <CodeIcon className="w-3 h-3 text-white/60" />;
}

/**
 * SaveToast 컴포넌트
 */
function SaveToastContent({ state, onDismiss, onRetry }: SaveToastProps) {
  const { steps, isComplete, hasError } = state;
  const progress = calculateProgress(steps);

  // 상태별 배경색
  const bgGradient = hasError
    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
    : isComplete
    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";

  // 타이틀
  const title = hasError
    ? "저장 실패"
    : isComplete
    ? "저장 완료"
    : "저장 중...";

  return (
    <div
      className="flex flex-col gap-2 px-4 py-3 rounded-xl shadow-lg min-w-[300px] max-w-md"
      style={{
        background: bgGradient,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 상태 아이콘 */}
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: "rgba(255, 255, 255, 0.2)" }}
          >
            {hasError ? (
              <XIcon className="w-4 h-4 text-white" />
            ) : isComplete ? (
              <CheckIcon className="w-4 h-4 text-white" />
            ) : (
              <LoadingIcon className="w-4 h-4 text-white animate-spin" />
            )}
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>

        {/* 닫기 버튼 (완료 또는 에러 시에만) */}
        {(isComplete || hasError) && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg transition-colors hover:bg-white/20"
          >
            <XIcon className="w-4 h-4 text-white/80" />
          </button>
        )}
      </div>

      {/* 프로그래스바 */}
      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 단계별 상태 */}
      <div className="flex flex-col gap-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <StepIcon status={step.status} />
            <StepLabelIcon stepId={step.id} />
            <span className="text-xs text-white/90 flex-1">{step.label}</span>
            {step.count !== undefined && step.status === "success" && (
              <span className="text-xs text-white/70">({step.count}개)</span>
            )}
            {step.error && (
              <span className="text-xs text-white/70 truncate max-w-[120px]">
                {step.error}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 재시도 버튼 (에러 시) */}
      {hasError && onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-white hover:bg-white/90 transition-colors self-end"
        >
          재시도
        </button>
      )}
    </div>
  );
}

// 토스트 ID 상수
const SAVE_TOAST_ID = "save-progress-toast";

/**
 * SaveToast 표시
 */
export function showSaveToast(state: SaveToastState, onRetry?: () => void) {
  toast.custom(
    (t) => (
      <SaveToastContent
        state={state}
        onDismiss={() => toast.dismiss(t)}
        onRetry={onRetry}
      />
    ),
    {
      id: SAVE_TOAST_ID,
      duration: state.isComplete || state.hasError ? 3000 : Infinity,
      position: "bottom-right",
    }
  );
}

/**
 * SaveToast 업데이트
 */
export function updateSaveToast(state: SaveToastState, onRetry?: () => void) {
  toast.custom(
    (t) => (
      <SaveToastContent
        state={state}
        onDismiss={() => toast.dismiss(t)}
        onRetry={onRetry}
      />
    ),
    {
      id: SAVE_TOAST_ID,
      duration: state.isComplete || state.hasError ? 3000 : Infinity,
      position: "bottom-right",
    }
  );
}

/**
 * SaveToast 닫기
 */
export function dismissSaveToast() {
  toast.dismiss(SAVE_TOAST_ID);
}

/**
 * 초기 SaveToastState 생성
 */
export function createInitialSaveState(
  hasFlagChanges: boolean,
  hasPlanChanges: boolean
): SaveToastState {
  const steps: SaveStep[] = [];

  if (hasFlagChanges) {
    steps.push({
      id: "flags",
      label: "Flags 저장",
      status: "pending",
    });
  }

  if (hasPlanChanges) {
    steps.push({
      id: "plans",
      label: "Plans 저장",
      status: "pending",
    });
  }

  return {
    steps,
    isComplete: false,
    hasError: false,
  };
}

/**
 * SaveToastState 업데이트 헬퍼
 */
export function updateStepStatus(
  state: SaveToastState,
  stepId: string,
  status: SaveStepStatus,
  count?: number,
  error?: string
): SaveToastState {
  const newSteps = state.steps.map((step) =>
    step.id === stepId ? { ...step, status, count, error } : step
  );

  const allComplete = newSteps.every(
    (step) => step.status === "success" || step.status === "error"
  );
  const hasError = newSteps.some((step) => step.status === "error");

  return {
    steps: newSteps,
    isComplete: allComplete,
    hasError,
  };
}
