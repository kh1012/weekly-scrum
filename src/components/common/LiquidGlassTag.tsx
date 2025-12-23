"use client";

import { ReactNode } from "react";

interface LiquidGlassTagProps {
  children: ReactNode;
  /** 태그 색상 테마 */
  variant?: "blue" | "green" | "orange" | "pink" | "purple" | "gray";
  /** 반짝임 애니메이션 활성화 */
  shimmer?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

const variantStyles = {
  blue: {
    color: "rgba(59, 130, 246, 0.95)",
    background:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 197, 253, 0.08) 50%, rgba(59, 130, 246, 0.15) 100%)",
    border: "rgba(59, 130, 246, 0.25)",
    glow: "rgba(59, 130, 246, 0.3)",
  },
  green: {
    color: "rgba(16, 185, 129, 0.95)",
    background:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(110, 231, 183, 0.08) 50%, rgba(16, 185, 129, 0.15) 100%)",
    border: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.3)",
  },
  orange: {
    color: "rgba(249, 115, 22, 0.95)",
    background:
      "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(253, 186, 116, 0.08) 50%, rgba(249, 115, 22, 0.15) 100%)",
    border: "rgba(249, 115, 22, 0.25)",
    glow: "rgba(249, 115, 22, 0.3)",
  },
  pink: {
    color: "rgba(236, 72, 153, 0.95)",
    background:
      "linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(249, 168, 212, 0.08) 50%, rgba(236, 72, 153, 0.15) 100%)",
    border: "rgba(236, 72, 153, 0.25)",
    glow: "rgba(236, 72, 153, 0.3)",
  },
  purple: {
    color: "rgba(139, 92, 246, 0.95)",
    background:
      "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(196, 181, 253, 0.08) 50%, rgba(139, 92, 246, 0.15) 100%)",
    border: "rgba(139, 92, 246, 0.25)",
    glow: "rgba(139, 92, 246, 0.3)",
  },
  gray: {
    color: "rgba(107, 114, 128, 0.95)",
    background:
      "linear-gradient(135deg, rgba(107, 114, 128, 0.12) 0%, rgba(156, 163, 175, 0.08) 50%, rgba(107, 114, 128, 0.15) 100%)",
    border: "rgba(107, 114, 128, 0.25)",
    glow: "rgba(107, 114, 128, 0.3)",
  },
};

/**
 * iOS 26 Liquid Glass 스타일 태그 컴포넌트
 * - 고급 블러 효과
 * - 미묘한 내부 광택
 * - 부드러운 그라데이션 테두리
 * - 선택적 반짝임 애니메이션
 */
export function LiquidGlassTag({
  children,
  variant = "blue",
  shimmer = false,
  className = "",
}: LiquidGlassTagProps) {
  const style = variantStyles[variant];

  return (
    <span
      className={`liquid-glass-tag ${
        shimmer ? "liquid-glass-shimmer" : ""
      } ${className}`}
      style={
        {
          // 기본 스타일
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 7px",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: style.color,
          // Liquid Glass 배경
          background: style.background,
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          // 부드러운 테두리
          border: `1px solid ${style.border}`,
          borderRadius: "6px",
          // 내부 광택 효과
          boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, 0.4),
          inset 0 -1px 1px rgba(0, 0, 0, 0.05),
          0 1px 2px rgba(0, 0, 0, 0.04),
          0 0 0 0.5px ${style.border}
        `,
          // CSS 변수 (애니메이션용)
          "--glow-color": style.glow,
          "--border-color": style.border,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

export default LiquidGlassTag;
