"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { ContinuityResult, ContinuityStatus } from "./types";
import { createSnapshotKey, analyzeContinuity } from "./types";
import { EmptyState } from "../common/EmptyState";

interface SnapshotContinuityViewProps {
  currentItems: ScrumItem[];
  prevWeekItems: ScrumItem[];
  nextWeekItems: ScrumItem[];
  currentWeekKey: string;
  prevWeekKey: string | null;
  nextWeekKey: string | null;
}

export function SnapshotContinuityView({
  currentItems,
  prevWeekItems,
  nextWeekItems,
  currentWeekKey,
  prevWeekKey,
  nextWeekKey,
}: SnapshotContinuityViewProps) {
  // 연속성 분석 결과 계산
  const continuityResults = useMemo((): ContinuityResult[] => {
    const results: ContinuityResult[] = [];

    // 현재 주차 아이템을 키로 그룹화
    const currentByKey = new Map<string, ScrumItem>();
    currentItems.forEach((item) => {
      const key = createSnapshotKey(item);
      currentByKey.set(key, item);
    });

    // 이전 주차 아이템 맵
    const prevByKey = new Map<string, ScrumItem>();
    prevWeekItems.forEach((item) => {
      const key = createSnapshotKey(item);
      prevByKey.set(key, item);
    });

    // 다음 주차 아이템 맵
    const nextByKey = new Map<string, ScrumItem>();
    nextWeekItems.forEach((item) => {
      const key = createSnapshotKey(item);
      nextByKey.set(key, item);
    });

    // 모든 키 수집
    const allKeys = new Set<string>();
    currentByKey.forEach((_, key) => allKeys.add(key));
    prevByKey.forEach((_, key) => allKeys.add(key));
    nextByKey.forEach((_, key) => allKeys.add(key));

    // 각 키에 대해 연속성 분석
    allKeys.forEach((key) => {
      const current = currentByKey.get(key) || null;
      const prev = prevByKey.get(key) || null;
      const next = nextByKey.get(key) || null;

      // 최소 현재 주차에 있어야 함
      if (!current) return;

      // prev.thisWeek(=next) vs current.pastWeek(=progress) 비교
      let prevToCurrent: ContinuityStatus = "unknown";
      if (prev && current) {
        prevToCurrent = analyzeContinuity(prev.next, current.progress);
      }

      // current.thisWeek(=next) vs next.pastWeek(=progress) 비교
      let currentToNext: ContinuityStatus = "unknown";
      if (current && next) {
        currentToNext = analyzeContinuity(current.next, next.progress);
      }

      results.push({
        key,
        person: current.name,
        domain: current.domain,
        project: current.project,
        module: current.module || null,
        feature: current.topic,
        prevWeek: prev,
        currentWeek: current,
        nextWeek: next,
        prevToCurrent,
        currentToNext,
      });
    });

    return results.sort((a, b) => {
      // 연속성 문제가 있는 것 먼저
      const aScore = getStatusScore(a.prevToCurrent) + getStatusScore(a.currentToNext);
      const bScore = getStatusScore(b.prevToCurrent) + getStatusScore(b.currentToNext);
      if (aScore !== bScore) return aScore - bScore;
      return a.person.localeCompare(b.person, "ko");
    });
  }, [currentItems, prevWeekItems, nextWeekItems]);

  if (continuityResults.length === 0) {
    return (
      <EmptyState
        message="연속성 분석 결과가 없습니다"
        submessage="최소 2주차 이상의 데이터가 필요합니다"
      />
    );
  }

  // 통계
  const stats = useMemo(() => {
    let connected = 0;
    let partial = 0;
    let broken = 0;

    continuityResults.forEach((result) => {
      if (result.prevToCurrent === "connected") connected++;
      else if (result.prevToCurrent === "partial") partial++;
      else if (result.prevToCurrent === "broken") broken++;

      if (result.currentToNext === "connected") connected++;
      else if (result.currentToNext === "partial") partial++;
      else if (result.currentToNext === "broken") broken++;
    });

    return { connected, partial, broken };
  }, [continuityResults]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
            연속성 분석
          </h2>
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            이전 thisWeek ↔ 현재 pastWeek · 현재 thisWeek ↔ 다음 pastWeek
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatBadge label="연결" count={stats.connected} color="#22c55e" />
          <StatBadge label="부분" count={stats.partial} color="#f59e0b" />
          <StatBadge label="단절" count={stats.broken} color="#ef4444" />
        </div>
      </div>

      {/* 주차 정보 */}
      <div className="flex items-center justify-center gap-4 py-2">
        <WeekBadge label="이전 주차" weekKey={prevWeekKey} />
        <span style={{ color: "var(--notion-text-muted)" }}>→</span>
        <WeekBadge label="현재 주차" weekKey={currentWeekKey} isActive />
        <span style={{ color: "var(--notion-text-muted)" }}>→</span>
        <WeekBadge label="다음 주차" weekKey={nextWeekKey} />
      </div>

      {/* 결과 테이블 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--notion-bg-secondary)" }}>
              <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--notion-text-muted)" }}>
                담당자
              </th>
              <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--notion-text-muted)" }}>
                업무 흐름
              </th>
              <th className="px-4 py-2 text-center font-medium" style={{ color: "var(--notion-text-muted)" }}>
                이전 → 현재
              </th>
              <th className="px-4 py-2 text-center font-medium" style={{ color: "var(--notion-text-muted)" }}>
                현재 → 다음
              </th>
            </tr>
          </thead>
          <tbody>
            {continuityResults.map((result, index) => (
              <tr key={result.key} style={{ borderTop: "1px solid var(--notion-border)" }}>
                <td className="px-4 py-3" style={{ color: "var(--notion-text)" }}>
                  {result.person}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium" style={{ color: "var(--notion-text)" }}>
                      {result.feature}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--notion-text-muted)" }}>
                      {result.domain} / {result.project}
                      {result.module && ` / ${result.module}`}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusIndicator status={result.prevToCurrent} hasData={!!result.prevWeek} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusIndicator status={result.currentToNext} hasData={!!result.nextWeek} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color }}>
        {count}
      </span>
    </div>
  );
}

function WeekBadge({
  label,
  weekKey,
  isActive = false,
}: {
  label: string;
  weekKey: string | null;
  isActive?: boolean;
}) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: isActive ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
        color: isActive ? "#3b82f6" : "var(--notion-text-muted)",
        border: isActive ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
      }}
    >
      <div className="font-medium">{label}</div>
      <div className="text-[10px]">{weekKey || "없음"}</div>
    </div>
  );
}

function StatusIndicator({ status, hasData }: { status: ContinuityStatus; hasData: boolean }) {
  if (!hasData) {
    return (
      <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        -
      </span>
    );
  }

  const config: Record<ContinuityStatus, { label: string; color: string; bg: string }> = {
    connected: { label: "연결됨", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
    partial: { label: "부분 일치", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    broken: { label: "단절됨", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
    unknown: { label: "분석 불가", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.1)" },
  };

  const { label, color, bg } = config[status];

  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

function getStatusScore(status: ContinuityStatus): number {
  switch (status) {
    case "broken":
      return 0;
    case "partial":
      return 1;
    case "connected":
      return 2;
    default:
      return 3;
  }
}

