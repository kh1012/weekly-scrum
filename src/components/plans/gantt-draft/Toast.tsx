/**
 * Toast 알림 컴포넌트 (sonner 기반)
 * - Airbnb 스타일 그라데이션 디자인 유지
 * - 여러 토스트 쌓기 지원
 * - 로딩 토스트 및 상태 업데이트 지원 (Export 기능용)
 */

"use client";

import { Toaster, toast } from "sonner";
import {
  CheckIcon,
  XIcon,
  InfoIcon,
  LoadingIcon,
} from "@/components/common/Icons";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

const typeConfig: Record<
  ToastType,
  { icon: React.ReactNode; gradient: string; iconBg: string }
> = {
  success: {
    icon: <CheckIcon className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    iconBg: "rgba(255, 255, 255, 0.2)",
  },
  error: {
    icon: <XIcon className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    iconBg: "rgba(255, 255, 255, 0.2)",
  },
  warning: {
    icon: <InfoIcon className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    iconBg: "rgba(255, 255, 255, 0.2)",
  },
  info: {
    icon: <InfoIcon className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    iconBg: "rgba(255, 255, 255, 0.2)",
  },
  loading: {
    icon: <LoadingIcon className="w-4 h-4 animate-spin" />,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    iconBg: "rgba(255, 255, 255, 0.2)",
  },
};

/**
 * 커스텀 토스트 렌더러 - 기존 스타일 유지
 */
function CustomToast({
  type,
  title,
  message,
  onDismiss,
}: {
  type: ToastType;
  title: string;
  message?: string;
  onDismiss: () => void;
}) {
  const config = typeConfig[type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-md"
      style={{
        background: config.gradient,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* 아이콘 */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
        style={{ background: config.iconBg }}
      >
        <span style={{ color: "white" }}>{config.icon}</span>
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        {message && (
          <p className="text-xs text-white/80 mt-0.5 whitespace-pre-line">
            {message}
          </p>
        )}
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg transition-colors hover:bg-white/20"
      >
        <XIcon className="w-4 h-4 text-white/80" />
      </button>
    </div>
  );
}

/**
 * 토스트 표시 함수
 * - DraftGanttView 등에서 직접 호출
 */
export function showToast(type: ToastType, title: string, message?: string) {
  toast.custom(
    (t) => (
      <CustomToast
        type={type}
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t)}
      />
    ),
    {
      duration: 5000,
      position: "bottom-right",
    }
  );
}

/**
 * 로딩 토스트 표시 (업데이트 가능)
 * - sonner의 내장 API 사용으로 안정성 확보
 * - Export 작업 등에서 사용
 * - 반환된 ID로 나중에 성공/실패 상태로 업데이트 가능
 */
export function showLoadingToast(
  title: string,
  message?: string
): string | number {
  const displayMessage = message ? `${title}\n${message}` : title;

  const toastId = toast.custom(
    (t) => (
      <CustomToast
        type="loading"
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t)}
      />
    ),
    {
      duration: Infinity, // 수동으로 닫거나 업데이트될 때까지 유지
      position: "bottom-right",
    }
  );

  return toastId;
}

/**
 * 토스트를 성공 상태로 업데이트
 * - 로딩 스피너가 체크 아이콘으로 전환
 * - 3초 후 자동으로 닫힘
 */
export function updateToastToSuccess(
  toastId: string | number,
  title: string,
  message?: string
) {
  // 기존 토스트 닫기
  toast.dismiss(toastId);

  // 새로운 성공 토스트 표시 (짧은 딜레이로 자연스러운 전환)
  setTimeout(() => {
    toast.custom(
      (t) => (
        <CustomToast
          type="success"
          title={title}
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: 3000,
        position: "bottom-right",
      }
    );
  }, 100);
}

/**
 * 토스트를 에러 상태로 업데이트
 * - 로딩 스피너가 X 아이콘으로 전환
 * - 5초 후 자동으로 닫힘 (에러는 좀 더 길게)
 */
export function updateToastToError(
  toastId: string | number,
  title: string,
  message?: string
) {
  // 기존 토스트 닫기
  toast.dismiss(toastId);

  // 새로운 에러 토스트 표시 (짧은 딜레이로 자연스러운 전환)
  setTimeout(() => {
    toast.custom(
      (t) => (
        <CustomToast
          type="error"
          title={title}
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: 5000,
        position: "bottom-right",
      }
    );
  }, 100);
}

/**
 * 비활성 경고 토스트 (연장 버튼 포함)
 */
export function showInactivityWarningToast(
  remainingMinutes: number,
  onExtend: () => void
) {
  const toastId = `inactivity-${remainingMinutes}`;

  // 이미 표시된 토스트가 있으면 무시
  if (document.querySelector(`[data-toast-id="${toastId}"]`)) {
    return;
  }

  toast.custom(
    (t) => (
      <div
        data-toast-id={toastId}
        className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[320px] max-w-md"
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* 아이콘 */}
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
        >
          <span style={{ color: "white" }}>
            <InfoIcon className="w-4 h-4" />
          </span>
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {remainingMinutes}분 후 자동 종료됩니다
          </p>
          <p className="text-xs text-white/80 mt-0.5">
            계속 작업하려면 연장 버튼을 눌러주세요
          </p>
        </div>

        {/* 연장 버튼 */}
        <button
          onClick={() => {
            onExtend();
            toast.dismiss(t);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-white hover:bg-white/90 transition-colors flex-shrink-0"
        >
          연장
        </button>

        {/* 닫기 버튼 */}
        <button
          onClick={() => toast.dismiss(t)}
          className="p-1 rounded-lg transition-colors hover:bg-white/20"
        >
          <XIcon className="w-4 h-4 text-white/80" />
        </button>
      </div>
    ),
    {
      duration: Infinity, // 자동으로 사라지지 않음
      position: "bottom-right",
      id: toastId,
    }
  );
}

/**
 * Toaster 컨테이너 - 레이아웃에 한 번만 배치
 */
export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors={false}
      closeButton={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "!bg-transparent !border-0 !shadow-none !p-0",
        },
      }}
    />
  );
}

// 기존 호환성을 위한 export (사용하지 않지만 타입 유지)
export { toast };
