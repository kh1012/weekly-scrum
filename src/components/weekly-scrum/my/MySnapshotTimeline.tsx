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
  /** 주차 범위 변경 핸들러 */
  onWeeksRangeChange?: (range: 8 | 12 | 16) => void;
}

export function MySnapshotTimeline({ 
  entries, 
  weeksRange = 12,
  onWeeksRangeChange,
}: MySnapshotTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SnapshotTimelineEntry | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
          {/* 주차 범위 선택 UI (빈 상태에도 표시) */}
          {onWeeksRangeChange && (
            <div className="mb-4">
              <WeekRangeSelector
                selectedRange={weeksRange}
                onChange={onWeeksRangeChange}
              />
            </div>
          )}
          
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

  // 모바일: 간소화된 리스트 뷰
  if (isMobile) {
    return (
      <div className="w-full" ref={containerRef}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden divide-y divide-[#d0d7de]">
            {metaGroups.map((group) => (
              <MobileMetaGroupItem
                key={group.metaKey}
                group={group}
                weekAxis={weekAxis}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 데스크톱: Gantt 타임라인
  return (
    <div className="w-full" ref={containerRef}>
      {/* 컨트롤 바: 주차 범위 선택 + 필터 + 검색 */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {onWeeksRangeChange && (
            <WeekRangeSelector
              selectedRange={weeksRange}
              onChange={onWeeksRangeChange}
            />
          )}
          
          {/* 통계 정보 */}
          <div className="ml-auto flex items-center gap-4 text-sm text-[#57606a]">
            <span>{metaGroups.length}개 기능</span>
            <span>•</span>
            <span>{entries.length}개 엔트리</span>
            <span>•</span>
            <span>{weekAxis.length}주간</span>
          </div>
        </div>
      </div>

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
                            onClick={() => {
                              setSelectedEntryId(weekEntries[0].id);
                              setSelectedEntry(weekEntries[0]);
                            }}
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
 * 주차 범위 선택기
 */
interface WeekRangeSelectorProps {
  selectedRange: 8 | 12 | 16;
  onChange: (range: 8 | 12 | 16) => void;
}

function WeekRangeSelector({ selectedRange, onChange }: WeekRangeSelectorProps) {
  const options: Array<{ value: 8 | 12 | 16; label: string }> = [
    { value: 8, label: "최근 8주" },
    { value: 12, label: "최근 12주" },
    { value: 16, label: "최근 16주" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#57606a]">기간:</span>
      <div className="flex rounded-md border border-[#d0d7de] overflow-hidden">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-[#d0d7de] last:border-r-0 ${
              selectedRange === option.value
                ? "bg-[#0969da] text-white"
                : "bg-white text-[#24292f] hover:bg-[#f6f8fa]"
            }`}
          >
            {option.label}
          </button>
        ))}
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

/**
 * 모바일용 Meta 그룹 아이템 (간소화된 리스트)
 */
interface MobileMetaGroupItemProps {
  group: MetaGroup;
  weekAxis: WeekAxisItem[];
}

function MobileMetaGroupItem({ group, weekAxis }: MobileMetaGroupItemProps) {
  const [expanded, setExpanded] = useState(false);

  // 그룹이 등장하는 주차들만 추출 (시간 순)
  const presentWeeks = weekAxis.filter((week) =>
    group.entriesByWeek.has(week.weekKey)
  );

  return (
    <div className="p-4">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#24292f]">
            {group.feature}
          </div>
          <div className="text-xs text-[#57606a] mt-0.5 truncate">
            {group.domain} / {group.project}
            {group.module && ` / ${group.module}`}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#8c959f]">
              {group.totalCount}개 엔트리
            </span>
            <span className="text-xs text-[#8c959f]">•</span>
            <span className="text-xs text-[#8c959f]">
              {presentWeeks.length}주간
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[#57606a] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 확장 영역: 주차별 엔트리 */}
      {expanded && (
        <div className="mt-4 space-y-2">
          {presentWeeks.map((week) => {
            const weekEntries = group.entriesByWeek.get(week.weekKey) || [];
            return (
              <div
                key={week.weekKey}
                className="bg-[#f6f8fa] rounded p-3 border border-[#d0d7de]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#24292f]">
                    {week.year} {week.week}
                  </span>
                  <span className="text-xs text-[#8c959f]">
                    {weekEntries.length}개
                  </span>
                </div>
                <div className="space-y-1">
                  {weekEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="text-xs text-[#57606a] truncate"
                    >
                      • {entry.name}
                      {entry.pastWeek?.tasks?.[0]?.title &&
                        `: ${entry.pastWeek.tasks[0].title}`}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

