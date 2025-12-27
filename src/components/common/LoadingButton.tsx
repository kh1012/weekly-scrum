/**
 * LoadingButton - 로딩 스피너가 통합된 공통 버튼 컴포넌트
 * 
 * GitHub 스타일: 미니멀한 디자인, 그림자 제거, solid 색상
 */

import React, { ButtonHTMLAttributes } from "react";
import { LoadingIcon } from "./Icons";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 로딩 중 표시할 텍스트 */
  loadingText?: string;
  /** 버튼 variant */
  variant?: "primary" | "success" | "danger" | "secondary" | "ghost";
  /** 버튼 크기 */
  size?: "xs" | "sm" | "md" | "lg";
  /** 아이콘 (왼쪽) */
  icon?: React.ReactNode;
  /** 아이콘 (오른쪽) */
  iconRight?: React.ReactNode;
  /** Badge (숫자 표시) */
  badge?: number;
  /** 전체 너비 */
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: "bg-[#0969da] text-white border-0 hover:bg-[#0860ca]",
  success: "bg-[#1f883d] text-white border-0 hover:bg-[#1a7f37]",
  danger: "bg-[#cf222e] text-white border-0 hover:bg-[#a40e26]",
  secondary: "bg-white text-[#24292f] border border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#0969da]",
  ghost: "bg-transparent text-[#57606a] border-0 hover:bg-[#f6f8fa]",
};

const sizeStyles = {
  xs: "px-2 py-1 text-[10px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
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
  disabled,
  className = "",
  children,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        flex items-center justify-center gap-2 rounded-md font-medium
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {/* 로딩 스피너 또는 아이콘 */}
      {isLoading ? (
        <LoadingIcon className={`${size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} animate-spin`} />
      ) : (
        icon
      )}

      {/* 텍스트 */}
      <span>{isLoading && loadingText ? loadingText : children}</span>

      {/* 오른쪽 아이콘 또는 Badge */}
      {!isLoading && badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-white/20 rounded-full">
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
    <LoadingIcon className={`${sizeClass} animate-spin ${className}`} />
  );
}

