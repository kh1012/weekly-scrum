"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { RiskLevel } from "@/types/scrum";
import { getRiskLevelColor } from "@/lib/colorDefines";

interface RiskLevelBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function RiskLevelBadge({ level, size = "md", showLabel = true }: RiskLevelBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLSpanElement>(null);
  const color = getRiskLevelColor(level);

  useEffect(() => {
    if (isHovered && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [isHovered]);

  const sizeClasses = size === "sm" 
    ? "px-1 py-0.5 text-[8px]" 
    : "px-1.5 py-0.5 text-[9px]";

  return (
    <>
      <span
        ref={badgeRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded font-semibold cursor-help ${sizeClasses}`}
        style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
      >
        {showLabel ? `Lv.${level}` : level}
      </span>
      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div 
              className="rounded-lg shadow-lg px-3 py-2 min-w-[180px] max-w-[280px]"
              style={{ background: color.text }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-xs font-bold">
                  Level {level}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  {color.label}
                </span>
              </div>
              <div className="text-[11px] text-white/90 leading-normal">
                {color.description}
              </div>
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
              style={{ borderTopColor: color.text }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

interface RiskLevelDotProps {
  level: RiskLevel;
  size?: "sm" | "md";
}

export function RiskLevelDot({ level, size = "md" }: RiskLevelDotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const dotRef = useRef<HTMLSpanElement>(null);
  const color = getRiskLevelColor(level);

  useEffect(() => {
    if (isHovered && dotRef.current) {
      const rect = dotRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [isHovered]);

  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <>
      <span
        ref={dotRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded-full cursor-help ${dotSize}`}
        style={{ background: color.text }}
      />
      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div 
              className="rounded-lg shadow-lg px-3 py-2 min-w-[180px] max-w-[280px]"
              style={{ background: color.text }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-xs font-bold">
                  Level {level}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  {color.label}
                </span>
              </div>
              <div className="text-[11px] text-white/90 leading-normal">
                {color.description}
              </div>
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
              style={{ borderTopColor: color.text }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

