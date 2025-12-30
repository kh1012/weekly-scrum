"use client";

import { useState, useEffect, useCallback } from "react";
import { useAvailableSnapshotWeeks } from "./useAvailableSnapshotWeeks";
import { WeekChecklist } from "./WeekChecklist";

interface CollaboratorGraphViewProps {
  workspaceId: string;
}

export function CollaboratorGraphView({
  workspaceId,
}: CollaboratorGraphViewProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const { weeks, isLoading, error } = useAvailableSnapshotWeeks(workspaceId);

  // 자동으로 최근 4주 선택 (첫 로드 시)
  useEffect(() => {
    if (!isLoading && weeks.length > 0 && selectedWeeks.size === 0) {
      const last4 = weeks.slice(0, 4).map((w) => w.weekKey);
      setSelectedWeeks(new Set(last4));
    }
  }, [weeks, isLoading, selectedWeeks.size]);

  const toggleWeek = useCallback((weekKey: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedWeeks(new Set(weeks.map((w) => w.weekKey)));
  }, [weeks]);

  const selectNone = useCallback(() => {
    setSelectedWeeks(new Set());
  }, []);

  const selectLast4 = useCallback(() => {
    const last4 = weeks.slice(0, 4).map((w) => w.weekKey);
    setSelectedWeeks(new Set(last4));
  }, [weeks]);

  const selectLast8 = useCallback(() => {
    const last8 = weeks.slice(0, 8).map((w) => w.weekKey);
    setSelectedWeeks(new Set(last8));
  }, [weeks]);

  return (
    <div className="h-full flex flex-col bg-[#f6f8fa]">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-[#d0d7de] px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-2xl font-bold text-[#24292f]">
            Collaborator Graph
          </h1>
          <p className="text-sm text-[#57606a] mt-1">
            주차별 협업 관계를 시각화하여 팀 내 협력 패턴을 파악합니다
          </p>
        </div>
      </div>

      {/* Main Content: 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1400px] mx-auto px-6 py-4 flex gap-4">
          {/* Left Panel: Week Selector */}
          <div className="w-80 shrink-0 bg-white rounded-lg border border-[#d0d7de] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#d0d7de]">
              <h2 className="text-sm font-semibold text-[#24292f]">
                주차 선택
              </h2>
              <p className="text-xs text-[#57606a] mt-1">
                데이터가 있는 주차만 표시됩니다
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600 font-medium">
                    데이터 로드 실패
                  </p>
                  <p className="text-xs text-[#57606a] mt-1">{error}</p>
                </div>
              ) : (
                <WeekChecklist
                  weeks={weeks}
                  selectedWeeks={selectedWeeks}
                  onToggleWeek={toggleWeek}
                  onSelectAll={selectAll}
                  onSelectNone={selectNone}
                  onSelectLast4={selectLast4}
                  onSelectLast8={selectLast8}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>

          {/* Center Panel: React Flow Graph */}
          <div className="flex-1 bg-white rounded-lg border border-[#d0d7de] overflow-hidden">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto text-[#d0d7de] mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-[#57606a] font-medium">
                  주차를 선택하여 협업 그래프를 확인하세요
                </p>
                <p className="text-xs text-[#8c959f] mt-2">
                  왼쪽에서 하나 이상의 주차를 선택하면 네트워크 그래프가
                  표시됩니다
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Analytics Cards */}
          <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
            <div className="bg-white rounded-lg border border-[#d0d7de] p-4">
              <h2 className="text-sm font-semibold text-[#24292f] mb-3">
                Overview
              </h2>
              <div className="text-center text-xs text-[#57606a] py-4">
                주차를 선택하면 통계가 표시됩니다
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#d0d7de] p-4">
              <h2 className="text-sm font-semibold text-[#24292f] mb-3">
                Top 3 Collaborators
              </h2>
              <div className="text-center text-xs text-[#57606a] py-4">
                데이터 없음
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#d0d7de] p-4">
              <h2 className="text-sm font-semibold text-[#24292f] mb-3">
                Distribution
              </h2>
              <div className="text-center text-xs text-[#57606a] py-4">
                데이터 없음
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

