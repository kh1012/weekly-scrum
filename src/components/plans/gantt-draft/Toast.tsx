/**
 * Toast 알림 컴포넌트 (sonner 기반)
 * - Airbnb 스타일 그라데이션 디자인 유지
 * - 여러 토스트 쌓기 지원
 */

"use client";

import { Toaster, toast } from "sonner";
import { CheckIcon, XIcon, InfoIcon } from "@/components/common/Icons";

export type ToastType = "success" | "error" | "info" | "warning";

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
