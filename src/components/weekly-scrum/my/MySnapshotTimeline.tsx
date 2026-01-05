/**
 * My Snapshot Timeline - Gantt-like 시각화 (Read-only)
 * 
 * Plans Gantt 스타일을 참고하여 구현:
 * - 좌측: Meta 그룹 목록 (sticky)
 * - 우측: 주차별 블록 (horizontal scroll)
 * - 화살표: 연속성 표시
 * - 읽기 전용: 드래그/수정/삭제 없음
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type {
  SnapshotTimelineEntry,
} from "@/lib/data/mySnapshotTimeline";
import {
  buildWeekAxis,
  groupEntriesByMeta,
  computeAllArrows,
  type WeekAxisItem,
  type MetaGroup,
  type ContinuityArrow,
} from "@/lib/data/snapshotTimelineUtils";

// 레이아웃 상수 (Plans Gantt 참고)
const WEEK_WIDTH = 120; // 주차 열 너비
const ROW_HEIGHT = 60; // 행 높이
const HEADER_HEIGHT = 64; // 헤더 높이
const LEFT_COLUMN_WIDTH = 320; // 좌측 메타 열 너비

interface MySnapshotTimelineProps {
  entries: SnapshotTimelineEntry[];
  /** 주차 범위 (8/12/16) */
  weeksRange?: 8 | 12 | 16;
}

export function MySnapshotTimeline({ entries, weeksRange = 12 }: MySnapshotTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Week Axis 및 Meta 그룹 계산
  const weekAxis = useMemo(() => buildWeekAxis(entries), [entries]);
  const metaGroups = useMemo(() => groupEntriesByMeta(entries), [entries]);
  const arrows = useMemo(() => computeAllArrows(metaGroups, weekAxis), [metaGroups, weekAxis]);

  // 타임라인 전체 너비
  const timelineWidth = weekAxis.length * WEEK_WIDTH;

  if (entries.length === 0) {
    return (
      <div className="w-full">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-white border border-[#d0d7de] rounded-md p-12 text-center">
            <p className="text-[#57606a] mb-2">스냅샷 엔트리가 없습니다</p>
            <p className="text-sm text-[#8c959f]">
              스냅샷을 작성하면 여기에 타임라인이 표시됩니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      <div className="overflow-x-auto">
        <div
          className="relative bg-white border-t border-b border-[#d0d7de]"
          style={{ minWidth: LEFT_COLUMN_WIDTH + timelineWidth }}
        >
          {/* 헤더 */}
          <div
            className="sticky top-0 z-10 bg-[#f6f8fa] border-b border-[#d0d7de] flex"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* 좌측 헤더 (Meta) */}
            <div
              className="sticky left-0 z-20 bg-[#f6f8fa] border-r border-[#d0d7de] flex items-center px-4 font-semibold text-sm text-[#24292f]"
              style={{ width: LEFT_COLUMN_WIDTH }}
            >
              <div className="flex-1">
                <div className="font-semibold">기능 그룹</div>
                <div className="text-xs text-[#57606a] font-normal mt-0.5">
                  Domain / Project / Module / Feature
                </div>
              </div>
              <div className="text-xs text-[#57606a] font-normal">
                {metaGroups.length}개
              </div>
            </div>

            {/* 주차 헤더 */}
            <div className="flex">
              {weekAxis.map((week) => (
                <div
                  key={week.weekKey}
                  className="flex flex-col items-center justify-center border-r border-[#d0d7de] last:border-r-0"
                  style={{ width: WEEK_WIDTH }}
                >
                  <div className="text-sm font-semibold text-[#24292f]">
                    {week.week}
                  </div>
                  <div className="text-xs text-[#57606a]">{week.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 타임라인 바디 */}
          <div className="relative">
            {/* SVG 오버레이 (화살표) */}
            <svg
              className="absolute inset-0 pointer-events-none z-5"
              style={{
                width: LEFT_COLUMN_WIDTH + timelineWidth,
                height: metaGroups.length * ROW_HEIGHT,
              }}
            >
              {arrows.map((arrow, idx) => {
                const groupIdx = metaGroups.findIndex(
                  (g) => g.metaKey === arrow.metaKey
                );
                const fromWeekIdx = weekAxis.findIndex(
                  (w) => w.weekKey === arrow.fromWeekKey
                );
                const toWeekIdx = weekAxis.findIndex(
                  (w) => w.weekKey === arrow.toWeekKey
                );

                if (groupIdx < 0 || fromWeekIdx < 0 || toWeekIdx < 0) return null;

                const y = (groupIdx + 0.5) * ROW_HEIGHT + HEADER_HEIGHT;
                const x1 = LEFT_COLUMN_WIDTH + (fromWeekIdx + 0.8) * WEEK_WIDTH;
                const x2 = LEFT_COLUMN_WIDTH + (toWeekIdx + 0.2) * WEEK_WIDTH;

                return (
                  <g key={`${arrow.metaKey}-${idx}`}>
                    <line
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke={arrow.type === "gap" ? "#0969da" : "#57606a"}
                      strokeWidth={arrow.type === "gap" ? 2 : 1.5}
                      strokeDasharray={arrow.type === "gap" ? "4 3" : undefined}
                      markerEnd="url(#arrowhead)"
                    />
                    {arrow.type === "gap" && arrow.gapWeeks && arrow.gapWeeks > 0 && (
                      <text
                        x={(x1 + x2) / 2}
                        y={y - 6}
                        fill="#0969da"
                        fontSize="10"
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        +{arrow.gapWeeks}주
                      </text>
                    )}
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 6 3, 0 6" fill="#57606a" />
                </marker>
              </defs>
            </svg>

            {/* 행들 */}
            {metaGroups.map((group, groupIdx) => (
              <div
                key={group.metaKey}
                className="flex border-b border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors"
                style={{ height: ROW_HEIGHT }}
              >
                {/* 좌측 메타 정보 */}
                <div
                  className="sticky left-0 z-10 bg-white border-r border-[#d0d7de] px-3 py-2 flex flex-col justify-center group-hover:bg-[#f6f8fa]"
                  style={{ width: LEFT_COLUMN_WIDTH }}
                >
                  <div className="text-sm font-medium text-[#24292f] truncate">
                    {group.feature}
                  </div>
                  <div className="text-xs text-[#57606a] truncate mt-0.5">
                    {group.domain} / {group.project}
                    {group.module && ` / ${group.module}`}
                  </div>
                  <div className="text-xs text-[#8c959f] mt-1">
                    {group.totalCount}개 엔트리
                  </div>
                </div>

                {/* 주차별 블록 */}
                <div className="flex relative">
                  {weekAxis.map((week, weekIdx) => {
                    const weekEntries = group.entriesByWeek.get(week.weekKey);
                    const hasEntry = weekEntries && weekEntries.length > 0;

                    return (
                      <div
                        key={week.weekKey}
                        className="border-r border-[#d0d7de] last:border-r-0 flex items-center justify-center p-2"
                        style={{ width: WEEK_WIDTH }}
                      >
                        {hasEntry && (
                          <SnapshotBlock
                            entries={weekEntries}
                            isSelected={
                              weekEntries.some((e) => e.id === selectedEntryId)
                            }
                            onClick={() =>
                              setSelectedEntryId(weekEntries[0].id)
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 스냅샷 블록 (Plans 스타일)
 */
interface SnapshotBlockProps {
  entries: SnapshotTimelineEntry[];
  isSelected: boolean;
  onClick: () => void;
}

function SnapshotBlock({ entries, isSelected, onClick }: SnapshotBlockProps) {
  const entry = entries[0]; // 대표 엔트리
  const count = entries.length;

  // 리스크 레벨에 따른 색상
  const getRiskColor = (level: number | null | undefined) => {
    if (level === 3) return "#cf222e"; // 심각
    if (level === 2) return "#fb8500"; // 중간
    if (level === 1) return "#f9c74f"; // 경미
    return "#1a7f37"; // 없음 (초록)
  };

  const riskLevel = entry.pastWeek?.riskLevel;
  const borderColor = getRiskColor(riskLevel);

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded border-2 bg-white hover:shadow-md transition-all flex flex-col p-2 text-left"
      style={{
        borderColor: isSelected ? "#0969da" : borderColor,
        boxShadow: isSelected
          ? "0 0 0 2px rgba(9, 105, 218, 0.2)"
          : undefined,
      }}
    >
      <div className="text-xs font-semibold text-[#24292f] truncate">
        {entry.name}
      </div>
      {count > 1 && (
        <div className="text-xs text-[#57606a] mt-0.5">+{count - 1}개 더</div>
      )}
      {entry.pastWeek?.tasks && entry.pastWeek.tasks.length > 0 && (
        <div className="text-xs text-[#57606a] mt-1 truncate">
          {entry.pastWeek.tasks[0].title}
        </div>
      )}
    </button>
  );
}

