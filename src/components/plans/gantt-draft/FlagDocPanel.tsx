/**
 * Flag Doc Panel
 * - Flag 클릭 시 표시되는 Release Doc 뷰
 * - DraftBar 데이터를 기반으로 계획 정보 표시 (API 호출 없음)
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDraftStore } from "./store";
import type { ReleaseDocRow, DraftFlag, ReadyInfo } from "./types";
import { FlagIcon, PaletteIcon } from "@/components/common/Icons";

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
  const setHighlightDateRange = useDraftStore((s) => s.setHighlightDateRange);

  // Row 클릭 핸들러 - 해당 Epic으로 스크롤 이동
  const handleRowClick = useCallback(
    (row: ReleaseDocRow) => {
      // 날짜 범위가 유효한 경우에만 처리
      if (!row.minStartDate || !row.maxEndDate) return;

      // 강조 표시 설정 (Epic은 feature 노드로 취급)
      setHighlightDateRange({
        startDate: row.minStartDate,
        endDate: row.maxEndDate,
        type: "node",
        color: "#10b981", // feature 색상 (green)
        nodeId: row.rowId,
      });

      // Timeline에서 해당 날짜 범위 중앙으로 스크롤하는 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("gantt:scroll-to-epic", {
          detail: {
            rowId: row.rowId,
            startDate: row.minStartDate,
            endDate: row.maxEndDate,
          },
        })
      );

      // 모달 닫기
      onClose();
    },
    [setHighlightDateRange, onClose]
  );

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

    // 삭제되지 않은 bars
    const activeBars = bars.filter((bar) => !bar.deleted);

    // 1단계: Flag 기간과 겹치는 bars의 rowId 집합 수집
    const overlappingRowIds = new Set<string>();
    for (const bar of activeBars) {
      if (
        isDateRangeOverlapping(
          bar.startDate,
          bar.endDate,
          flag.startDate,
          flag.endDate
        )
      ) {
        overlappingRowIds.add(bar.rowId);
      }
    }

    if (overlappingRowIds.size === 0) return [];

    // 2단계: 해당 rowId를 가진 모든 bars를 수집 (기획이 Flag 이전에 끝나도 포함)
    const relevantBars = activeBars.filter((bar) => overlappingRowIds.has(bar.rowId));

    // Epic (project > module > feature) 단위로 그룹화
    const epicGroups = new Map<
      string,
      {
        epic: string;
        bars: typeof relevantBars;
        planners: Set<string>; // 중복 제거를 위해 Set 사용
      }
    >();

    for (const bar of relevantBars) {
      // rowId에서 project::module::feature 추출
      const [project, module, feature] = bar.rowId.split("::");
      const epicKey = bar.rowId;
      const epicLabel =
        project && module && feature
          ? `${project} > ${module} > ${feature}`
          : bar.title;

      if (!epicGroups.has(epicKey)) {
        epicGroups.set(epicKey, {
          epic: epicLabel,
          bars: [],
          planners: new Set<string>(),
        });
      }

      const group = epicGroups.get(epicKey)!;
      group.bars.push(bar);

      // 모든 bars에서 기획자 수집 (기획 관련 stage의 담당자들)
      const isSpecStage = bar.stage?.includes("기획") || bar.stage?.toLowerCase().includes("spec");
      if (isSpecStage && bar.assignees) {
        for (const assignee of bar.assignees) {
          const role = assignee.role?.toLowerCase() ?? "";
          if (["기획", "planning", "pm", "planner"].includes(role) && assignee.displayName) {
            group.planners.add(assignee.displayName);
          }
        }
      }
    }

    // 각 Epic에 대해 Spec Ready / Design Ready 계산
    const result: ReleaseDocRow[] = [];
    
    // 현재 시간 기준 날짜 (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    for (const [epicKey, group] of epicGroups) {
      // Spec Ready 계산 - '기획' 또는 'spec'이 포함된 stage 모두 검색
      const specPlans = group.bars.filter((b) => 
        b.stage?.includes("기획") || b.stage?.toLowerCase().includes("spec")
      );
      const specReadyList: ReadyInfo[] = specPlans.map((plan) => {
        let value: string;
        if (plan.status === "완료") {
          value = "READY";
        } else {
          value = plan.endDate;
        }
        return { value, title: plan.title, endDate: plan.endDate };
      });

      // Design Ready 계산 - '디자인' 또는 'design'이 포함된 stage 모두 검색
      const designPlans = group.bars.filter((b) => 
        b.stage?.includes("디자인") || b.stage?.toLowerCase().includes("design")
      );
      const designReadyList: ReadyInfo[] = designPlans.map((plan) => {
        let value: string;
        if (plan.status === "완료") {
          value = "READY";
        } else {
          value = plan.endDate;
        }
        return { value, title: plan.title, endDate: plan.endDate };
      });

      // 날짜 범위 계산 (모든 bars 중 최소 startDate, 최대 endDate)
      const allDates = group.bars.flatMap((b) => [b.startDate, b.endDate]);
      const sortedDates = allDates.sort((a, b) => a.localeCompare(b));
      const minStartDate = sortedDates[0] || "";
      const maxEndDate = sortedDates[sortedDates.length - 1] || "";

      result.push({
        planId: group.bars[0]?.clientUid ?? "",
        rowId: epicKey,
        epic: group.epic,
        planners: Array.from(group.planners),
        specReadyList: specReadyList.length > 0 ? specReadyList : [{ value: "데이터 없음" }],
        designReadyList: designReadyList.length > 0 ? designReadyList : [{ value: "데이터 없음" }],
        minStartDate,
        maxEndDate,
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
        className="relative w-full max-w-5xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "white",
          maxHeight: "85vh",
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
                      <PaletteIcon className="w-4 h-4 text-purple-500" />
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
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {releaseDocRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                이 기간에 해당하는 계획이 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "27.5%" }} />
                  <col style={{ width: "27.5%" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-5 font-semibold text-gray-700 bg-gray-50 rounded-tl-lg">
                      Epic
                    </th>
                    <th className="text-left py-4 px-5 font-semibold text-gray-700 bg-gray-50">
                      기획자
                    </th>
                    <th className="text-left py-4 px-5 font-semibold text-gray-700 bg-gray-50">
                      Spec Ready
                    </th>
                    <th className="text-left py-4 px-5 font-semibold text-gray-700 bg-gray-50 rounded-tr-lg">
                      Design Ready
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {releaseDocRows.map((row, idx) => (
                    <tr
                      key={row.planId || idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer align-top"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="py-4 px-5">
                        <span className="font-medium text-gray-900">
                          {row.epic}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-gray-600">
                        {row.planners.length > 0 ? row.planners.join(", ") : "-"}
                      </td>
                      <td className="py-4 px-5">
                        <ReadyInfoList items={row.specReadyList} />
                      </td>
                      <td className="py-4 px-5">
                        <ReadyInfoList items={row.designReadyList} />
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
 * Ready 정보 목록 컴포넌트 (여러 개 표시)
 */
function ReadyInfoList({ items }: { items: ReadyInfo[] }) {
  if (items.length === 0) {
    return <span className="text-gray-400 text-xs">데이터 없음</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <ReadyInfoItem key={idx} info={item} />
      ))}
    </div>
  );
}

/**
 * Ready 정보 항목 컴포넌트 (날짜 태그 위, 제목 아래)
 */
function ReadyInfoItem({ info }: { info: ReadyInfo }) {
  const { value, title, endDate } = info;
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === "-" || value === "데이터 없음") {
    return <span className="text-gray-400 text-xs">데이터 없음</span>;
  }

  // 오늘 날짜 계산
  const today = new Date().toISOString().split("T")[0];
  
  // 날짜가 오늘 이전인지 확인 (완료된 것으로 간주)
  const dateToCheck = endDate || value;
  const isPastDate = value !== "READY" && dateToCheck <= today;
  const isReady = value === "READY" || isPastDate;

  // 제목 길이 제한 (30자)
  const MAX_TITLE_LENGTH = 30;
  const isTitleLong = title && title.length > MAX_TITLE_LENGTH;
  const displayTitle = isTitleLong && !isExpanded 
    ? title.slice(0, MAX_TITLE_LENGTH) + "..." 
    : title;

  return (
    <div className="flex flex-col gap-0.5">
      {/* 날짜 태그 (위) */}
      <div>
        {isReady ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Ready
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {value}
          </span>
        )}
      </div>
      
      {/* 제목 (아래) */}
      {title && (
        <div className="flex items-start gap-1">
          <span 
            className={`text-xs text-gray-500 ${isExpanded ? "" : "line-clamp-1"}`}
            style={{ wordBreak: "break-word" }}
          >
            {displayTitle}
          </span>
          {isTitleLong && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0 font-medium"
            >
              {isExpanded ? "접기" : "더보기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
