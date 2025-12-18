/**
 * Toast 알림 컴포넌트
 * - Airbnb 스타일 슬라이드 인 애니메이션
 */

"use client";

import { useEffect, useState } from "react";
import { CheckIcon, XIcon, InfoIcon } from "@/components/common/Icons";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; gradient: string; iconBg: string }> = {
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

export function Toast({
  isOpen,
  onClose,
  type = "success",
  title,
  message,
  duration = 4000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 애니메이션 완료 후 닫기
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen && !isVisible) return null;

  const config = typeConfig[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
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
            <p className="text-xs text-white/80 mt-0.5 whitespace-pre-line">{message}</p>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 rounded-lg transition-colors hover:bg-white/20"
        >
          <XIcon className="w-4 h-4 text-white/80" />
        </button>
      </div>
    </div>
  );
}

