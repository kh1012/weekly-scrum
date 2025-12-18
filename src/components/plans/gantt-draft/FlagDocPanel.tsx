/**
 * Flag Doc Panel
 * - Flag 클릭 시 표시되는 Release Doc 뷰
 * - DraftBar 데이터를 기반으로 계획 정보 표시 (API 호출 없음)
 */

"use client";

import { useEffect, useMemo } from "react";
import { useDraftStore } from "./store";
import type { ReleaseDocRow, DraftFlag } from "./types";
import { FlagIcon } from "@/components/common/Icons";

interface FlagDocPanelProps {
  isOpen: boolean;
  onClose: () => void;
  flag: DraftFlag | null;
  workspaceId: string;
}

/**
 * 두 날짜 범위가 겹치는지 확인
 */
function isDateRangeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2;
}

export function FlagDocPanel({
  isOpen,
  onClose,
  flag,
}: FlagDocPanelProps) {
  const bars = useDraftStore((s) => s.bars);
  const rows = useDraftStore((s) => s.rows);

  // Design 공유 날짜 계산 (UI 디자인 stage의 가장 빠른 시작일)
  const designShareDate = useMemo(() => {
    if (!flag) return null;

    // Flag 기간과 겹치는 UI 디자인 bars 찾기
    const designBars = bars.filter((bar) => {
      if (bar.deleted) return false;
      if (bar.stage !== "UI 디자인") return false;
      return isDateRangeOverlapping(
        bar.startDate,
        bar.endDate,
        flag.startDate,
        flag.endDate
      );
    });

    if (designBars.length === 0) return null;

    // 가장 빠른 시작일 찾기
    const sortedDates = designBars
      .map((b) => b.startDate)
      .sort((a, b) => a.localeCompare(b));

    return sortedDates[0];
  }, [flag, bars]);

  // Flag 기간과 겹치는 bars를 기반으로 Release Doc 행 생성
  const releaseDocRows = useMemo<ReleaseDocRow[]>(() => {
    if (!flag) return [];

    // Flag 기간과 겹치는 bars 필터링 (deleted 제외)
    const overlappingBars = bars.filter((bar) => {
      if (bar.deleted) return false;
      return isDateRangeOverlapping(
        bar.startDate,
        bar.endDate,
        flag.startDate,
        flag.endDate
      );
    });

    if (overlappingBars.length === 0) return [];

    // Epic (project > module > feature) 단위로 그룹화
    const epicGroups = new Map<
      string,
      {
        epic: string;
        bars: typeof overlappingBars;
        planner: string;
      }
    >();

    for (const bar of overlappingBars) {
      // rowId에서 project::module::feature 추출
      const [project, module, feature] = bar.rowId.split("::");
      const epicKey = bar.rowId;
      const epicLabel =
        project && module && feature
          ? `${project} > ${module} > ${feature}`
          : bar.title;

      if (!epicGroups.has(epicKey)) {
        // 기획자 찾기
        let planner = "-";
        const plannerAssignee = bar.assignees?.find((a) =>
          ["기획", "planning", "pm"].includes(a.role?.toLowerCase() ?? "")
        );
        if (plannerAssignee?.displayName) {
          planner = plannerAssignee.displayName;
        }

        epicGroups.set(epicKey, {
          epic: epicLabel,
          bars: [],
          planner,
        });
      }

      epicGroups.get(epicKey)!.bars.push(bar);
    }

    // 각 Epic에 대해 Spec Ready / Design Ready 계산
    const result: ReleaseDocRow[] = [];
    
    // 현재 시간 기준 날짜 (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    for (const [, group] of epicGroups) {
      // Spec Ready 계산 - '상세 기획' stage만 검색
      let specReady: string = "데이터 없음";
      const specPlan = group.bars.find((b) => b.stage === "상세 기획");
      if (specPlan) {
        // 완료 상태이고 종료일이 오늘 이전이면 'READY'
        if (specPlan.status === "완료" && specPlan.endDate <= today) {
          specReady = "READY";
        } else {
          specReady = specPlan.endDate;
        }
      }

      // Design Ready 계산 - 'UI 디자인' stage만 검색
      let designReady: string = "데이터 없음";
      const designPlan = group.bars.find((b) => b.stage === "UI 디자인");
      if (designPlan) {
        // 완료 상태이고 종료일이 오늘 이전이면 'READY'
        if (designPlan.status === "완료" && designPlan.endDate <= today) {
          designReady = "READY";
        } else {
          designReady = designPlan.endDate;
        }
      }

      result.push({
        planId: group.bars[0]?.clientUid ?? "",
        epic: group.epic,
        planner: group.planner,
        specReady,
        designReady,
      });
    }

    // Epic 이름으로 정렬
    result.sort((a, b) => a.epic.localeCompare(b.epic));

    return result;
  }, [flag, bars]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !flag) return null;

  const isPointFlag = flag.startDate === flag.endDate;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "white",
          maxHeight: "80vh",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: `linear-gradient(135deg, ${flag.color || "#ef4444"}20 0%, ${flag.color || "#ef4444"}10 100%)`,
            borderBottom: `1px solid ${flag.color || "#ef4444"}30`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: flag.color || "#ef4444",
              }}
            >
              <FlagIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {flag.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  {isPointFlag
                    ? flag.startDate
                    : `${flag.startDate} → ${flag.endDate}`}
                </span>
                {designShareDate && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="text-purple-500">🎨</span>
                      <span>Design 공유: {designShareDate}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {releaseDocRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                이 기간에 해당하는 계획이 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-gray-50 rounded-tl-lg">
                      Epic
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-gray-50">
                      기획자
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-gray-50">
                      Spec Ready
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 bg-gray-50 rounded-tr-lg">
                      Design Ready
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {releaseDocRows.map((row, idx) => (
                    <tr
                      key={row.planId || idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {row.epic}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{row.planner}</td>
                      <td className="py-3 px-4">
                        <DateChip value={row.specReady} />
                      </td>
                      <td className="py-3 px-4">
                        <DateChip value={row.designReady} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {releaseDocRows.length}개 Epic
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 날짜 칩 컴포넌트
 */
function DateChip({ value }: { value: string }) {
  if (value === "-" || value === "데이터 없음") {
    return <span className="text-gray-400 text-xs">{value === "-" ? "-" : "데이터 없음"}</span>;
  }

  if (value === "READY") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        READY
      </span>
    );
  }

  // 날짜 형식
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {value}
    </span>
  );
}
