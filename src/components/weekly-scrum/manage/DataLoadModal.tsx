"use client";

/**
 * 데이터 불러오기 모달
 * 
 * 이름 기준 / 주차 기준 두 가지 방식으로 데이터를 불러올 수 있습니다.
 */

import { useState, useMemo } from "react";
import type { LoadMode } from "./types";
import type { WeeklyScrumData } from "@/types/scrum";

interface WeekOptionInfo {
  key: string;
  label: string;
  range: string;
}

interface DataLoadModalProps {
  allNames: string[];
  weekOptions: WeekOptionInfo[];
  allData: Record<string, WeeklyScrumData>;
  onClose: () => void;
  onLoad: (selectedNames: Set<string>, selectedWeeks: Set<string>) => void;
}

export function DataLoadModal({
  allNames,
  weekOptions,
  allData,
  onClose,
  onLoad,
}: DataLoadModalProps) {
  const [mode, setMode] = useState<LoadMode>("byName");
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());

  // 이름 기준: 선택된 이름들에서 존재하는 주차 목록
  const availableWeeksForNames = useMemo(() => {
    if (selectedNames.size === 0) return [];

    const weeks = new Set<string>();
    weekOptions.forEach((week) => {
      const weekData = allData[week.key];
      if (weekData) {
        weekData.items.forEach((item) => {
          if (selectedNames.has(item.name)) {
            weeks.add(week.key);
          }
        });
      }
    });

    return weekOptions.filter((w) => weeks.has(w.key));
  }, [selectedNames, weekOptions, allData]);

  // 주차 기준: 선택된 주차들에서 존재하는 이름 목록
  const availableNamesForWeeks = useMemo(() => {
    if (selectedWeeks.size === 0) return [];

    const names = new Set<string>();
    selectedWeeks.forEach((weekKey) => {
      const weekData = allData[weekKey];
      if (weekData) {
        weekData.items.forEach((item) => {
          names.add(item.name);
        });
      }
    });

    return Array.from(names).sort();
  }, [selectedWeeks, allData]);

  // 이름 토글
  const toggleName = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // 주차 토글
  const toggleWeek = (weekKey: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  // 전체 선택/해제 - 이름
  const toggleAllNames = (names: string[]) => {
    const allSelected = names.every((n) => selectedNames.has(n));
    if (allSelected) {
      setSelectedNames((prev) => {
        const next = new Set(prev);
        names.forEach((n) => next.delete(n));
        return next;
      });
    } else {
      setSelectedNames((prev) => {
        const next = new Set(prev);
        names.forEach((n) => next.add(n));
        return next;
      });
    }
  };

  // 전체 선택/해제 - 주차
  const toggleAllWeeks = (weeks: WeekOptionInfo[]) => {
    const allSelected = weeks.every((w) => selectedWeeks.has(w.key));
    if (allSelected) {
      setSelectedWeeks((prev) => {
        const next = new Set(prev);
        weeks.forEach((w) => next.delete(w.key));
        return next;
      });
    } else {
      setSelectedWeeks((prev) => {
        const next = new Set(prev);
        weeks.forEach((w) => next.add(w.key));
        return next;
      });
    }
  };

  // 불러오기 실행
  const handleLoad = () => {
    if (selectedNames.size > 0 && selectedWeeks.size > 0) {
      onLoad(selectedNames, selectedWeeks);
      onClose();
    }
  };

  const canLoad = selectedNames.size > 0 && selectedWeeks.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            데이터 불러오기
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모드 탭 */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2">
          <button
            onClick={() => setMode("byName")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "byName"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            이름 기준 선택
          </button>
          <button
            onClick={() => setMode("byWeek")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "byWeek"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            주차 기준 선택
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden flex">
          {mode === "byName" ? (
            <>
              {/* 이름 리스트 */}
              <div className="w-1/2 border-r border-gray-100 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    이름 선택 ({selectedNames.size}/{allNames.length})
                  </span>
                  <button
                    onClick={() => toggleAllNames(allNames)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {allNames.every((n) => selectedNames.has(n)) ? "전체 해제" : "전체 선택"}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {allNames.map((name) => (
                    <label
                      key={name}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNames.has(name)}
                        onChange={() => toggleName(name)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 가능한 주차 리스트 */}
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    주차 선택 ({selectedWeeks.size}/{availableWeeksForNames.length})
                  </span>
                  {availableWeeksForNames.length > 0 && (
                    <button
                      onClick={() => toggleAllWeeks(availableWeeksForNames)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {availableWeeksForNames.every((w) => selectedWeeks.has(w.key)) ? "전체 해제" : "전체 선택"}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {selectedNames.size === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      먼저 이름을 선택하세요
                    </p>
                  ) : availableWeeksForNames.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      선택한 이름에 해당하는 데이터가 없습니다
                    </p>
                  ) : (
                    availableWeeksForNames.map((week) => (
                      <label
                        key={week.key}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWeeks.has(week.key)}
                          onChange={() => toggleWeek(week.key)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">{week.label}</span>
                          {week.range && (
                            <span className="text-xs text-gray-400 ml-2">
                              ({week.range})
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 주차 리스트 */}
              <div className="w-1/2 border-r border-gray-100 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    주차 선택 ({selectedWeeks.size}/{weekOptions.length})
                  </span>
                  <button
                    onClick={() => toggleAllWeeks(weekOptions)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {weekOptions.every((w) => selectedWeeks.has(w.key)) ? "전체 해제" : "전체 선택"}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {weekOptions.map((week) => (
                    <label
                      key={week.key}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWeeks.has(week.key)}
                        onChange={() => toggleWeek(week.key)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{week.label}</span>
                        {week.range && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({week.range})
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 가능한 이름 리스트 */}
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    이름 선택 ({selectedNames.size}/{availableNamesForWeeks.length})
                  </span>
                  {availableNamesForWeeks.length > 0 && (
                    <button
                      onClick={() => toggleAllNames(availableNamesForWeeks)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {availableNamesForWeeks.every((n) => selectedNames.has(n)) ? "전체 해제" : "전체 선택"}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {selectedWeeks.size === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      먼저 주차를 선택하세요
                    </p>
                  ) : availableNamesForWeeks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      선택한 주차에 해당하는 데이터가 없습니다
                    </p>
                  ) : (
                    availableNamesForWeeks.map((name) => (
                      <label
                        key={name}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNames.has(name)}
                          onChange={() => toggleName(name)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedNames.size > 0 && selectedWeeks.size > 0
              ? `${selectedNames.size}명 × ${selectedWeeks.size}주차 조합`
              : "이름과 주차를 선택하세요"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleLoad}
              disabled={!canLoad}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canLoad
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              불러오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

