/**
 * LoadingButton - 로딩 스피너가 통합된 공통 버튼 컴포넌트
 * 
 * GanttHeader의 "작업 시작" 버튼 스타일을 기반으로 제작
 */

import React, { ButtonHTMLAttributes } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 로딩 중 표시할 텍스트 */
  loadingText?: string;
  /** 버튼 variant */
  variant?: "primary" | "success" | "danger" | "secondary" | "ghost";
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  /** 아이콘 (왼쪽) */
  icon?: React.ReactNode;
  /** 아이콘 (오른쪽) */
  iconRight?: React.ReactNode;
  /** Badge (숫자 표시) */
  badge?: number;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 그라데이션 사용 여부 */
  gradient?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    hoverShadow: "0 6px 20px rgba(59, 130, 246, 0.5)",
  },
  success: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
    hoverShadow: "0 6px 20px rgba(16, 185, 129, 0.5)",
  },
  danger: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
    hoverShadow: "0 6px 20px rgba(239, 68, 68, 0.5)",
  },
  secondary: {
    background: "white",
    color: "#374151",
    border: "1px solid #e5e7eb",
  },
  ghost: {
    background: "transparent",
    color: "#6b7280",
  },
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function LoadingButton({
  isLoading = false,
  loadingText,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  badge,
  fullWidth = false,
  gradient = true,
  disabled,
  className = "",
  children,
  style,
  ...props
}: LoadingButtonProps) {
  const baseStyles = variantStyles[variant];
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isDisabled && gradient && variant !== "ghost" && variant !== "secondary" ? "hover:shadow-lg hover:-translate-y-0.5" : ""}
        ${variant === "secondary" && !isDisabled ? "hover:bg-gray-100" : ""}
        ${variant === "ghost" && !isDisabled ? "hover:bg-gray-100" : ""}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={{
        ...baseStyles,
        ...style,
      }}
    >
      {/* 로딩 스피너 또는 아이콘 */}
      {isLoading ? (
        <svg
          className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} animate-spin`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}

      {/* 텍스트 */}
      <span>{isLoading && loadingText ? loadingText : children}</span>

      {/* 오른쪽 아이콘 또는 Badge */}
      {!isLoading && badge !== undefined && badge > 0 && (
        <span
          className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
          style={{ background: "rgba(255,255,255,0.3)" }}
        >
          {badge}
        </span>
      )}
      {!isLoading && iconRight}
    </button>
  );
}

/**
 * 작은 로딩 스피너 (카드 내부 작은 버튼용)
 */
interface SmallLoadingSpinnerProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SmallLoadingSpinner({ size = "sm", className = "" }: SmallLoadingSpinnerProps) {
  const sizeClass = size === "xs" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  
  return (
    <svg
      className={`${sizeClass} animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

