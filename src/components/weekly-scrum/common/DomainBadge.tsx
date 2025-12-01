"use client";

import { getDomainColor } from "@/lib/colorDefines";

interface DomainBadgeProps {
  domain: string;
  size?: "sm" | "md";
}

export function DomainBadge({ domain, size = "sm" }: DomainBadgeProps) {
  const color = getDomainColor(domain);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full font-semibold`}
      style={{ background: color.bg, color: color.text }}
    >
      {domain}
    </span>
  );
}

