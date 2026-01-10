/**
 * Snapshot Entry Detail Popover
 * 
 * 스냅샷 엔트리의 상세 정보를 표시하는 팝오버
 */

"use client";

import { useEffect, useRef } from "react";
import type { SnapshotTimelineEntry } from "@/lib/data/snapshots";

interface SnapshotEntryPopoverProps {
  entry: SnapshotTimelineEntry;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SnapshotEntryPopover({
  entry,
  position,
  onClose,
}: SnapshotEntryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 리스크 레벨 레이블
  const getRiskLabel = (level: number | null | undefined) => {
    if (level === 3) return { text: "심각", color: "#cf222e" };
    if (level === 2) return { text: "중간", color: "#fb8500" };
    if (level === 1) return { text: "경미", color: "#f9c74f" };
    return { text: "없음", color: "#1a7f37" };
  };

  const riskInfo = getRiskLabel(entry.pastWeek?.riskLevel);

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* 팝오버 */}
      <div
        ref={popoverRef}
        className="fixed z-50 bg-white border border-[#d0d7de] rounded-md shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxWidth: "480px",
          width: "calc(100vw - 32px)",
        }}
      >
        {/* 헤더 */}
        <div className="border-b border-[#d0d7de] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[#24292f] mb-1">
                {entry.name}
              </h3>
              <div className="text-sm text-[#57606a]">
                {entry.domain} / {entry.project}
                {entry.module && ` / ${entry.module}`} / {entry.feature}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[#8c959f]">
                  {entry.year} {entry.week}
                </span>
                <span className="text-xs text-[#8c959f]">•</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${riskInfo.color}20`,
                    color: riskInfo.color,
                  }}
                >
                  리스크: {riskInfo.text}
                </span>
              </div>
            </div>
            
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#f6f8fa] transition-colors"
            >
              <svg
                className="w-5 h-5 text-[#57606a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Past Week */}
          {entry.pastWeek?.tasks && Array.isArray(entry.pastWeek.tasks) && entry.pastWeek.tasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#24292f] mb-2">
                지난 주 작업
              </h4>
              <div className="space-y-2">
                {entry.pastWeek.tasks.map((task, idx) => {
                  // task가 객체인지 문자열인지 확인
                  const taskTitle = typeof task === 'string' ? task : (task?.title || '제목 없음');
                  const taskProgress = typeof task === 'object' && task !== null && 'progress' in task 
                    ? task.progress 
                    : 100;

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2 rounded bg-[#f6f8fa]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#24292f]">{taskTitle}</div>
                        {typeof task === 'object' && task !== null && 'progress' in task && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-white rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0969da] transition-all"
                                style={{ width: `${taskProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#57606a]">
                              {taskProgress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk */}
          {entry.pastWeek?.risk && Array.isArray(entry.pastWeek.risk) && entry.pastWeek.risk.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#24292f] mb-2">
                리스크 내용
              </h4>
              <div className="space-y-1">
                {entry.pastWeek.risk.map((risk, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-[#57606a] p-2 rounded bg-[#f6f8fa]"
                  >
                    • {typeof risk === 'string' ? risk : String(risk)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* This Week */}
          {entry.thisWeek?.tasks && Array.isArray(entry.thisWeek.tasks) && entry.thisWeek.tasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#24292f] mb-2">
                이번 주 계획
              </h4>
              <div className="space-y-1">
                {entry.thisWeek.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-[#57606a] p-2 rounded bg-[#f6f8fa]"
                  >
                    • {typeof task === 'string' ? task : String(task)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

