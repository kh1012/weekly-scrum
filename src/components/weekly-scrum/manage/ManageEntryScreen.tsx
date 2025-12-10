"use client";

/**
 * 스냅샷 관리 초기 진입 화면
 * 
 * 두 개의 진입점:
 * - [데이터 불러오기]
 * - [새로 작성하기]
 */

import { useState } from "react";
import { DataLoadModal } from "./DataLoadModal";
import type { WeeklyScrumData } from "@/types/scrum";

interface WeekOptionInfo {
  key: string;
  label: string;
  range: string;
}

interface ManageEntryScreenProps {
  allNames: string[];
  weekOptions: WeekOptionInfo[];
  allData: Record<string, WeeklyScrumData>;
  onNewSnapshot: () => void;
  onLoadData: (selectedNames: Set<string>, selectedWeeks: Set<string>) => void;
}

export function ManageEntryScreen({
  allNames,
  weekOptions,
  allData,
  onNewSnapshot,
  onLoadData,
}: ManageEntryScreenProps) {
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            스냅샷 관리
          </h1>
          <p className="text-gray-600">
            매주 스냅샷을 더 빠르고 편하게 작성할 수 있는 관리 화면입니다.
          </p>
        </div>

        {/* 진입점 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 데이터 불러오기 */}
          <button
            onClick={() => setIsLoadModalOpen(true)}
            className="group relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              데이터 불러오기
            </h2>
            <p className="text-gray-600 text-sm">
              기존 스냅샷을 이름 또는 주차 기준으로 불러와서 편집합니다.
            </p>
            <div className="mt-4 text-xs text-gray-400">
              {allNames.length}명의 팀원 · {weekOptions.length}개 주차 데이터
            </div>
          </button>

          {/* 새로 작성하기 */}
          <button
            onClick={onNewSnapshot}
            className="group relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              새로 작성하기
            </h2>
            <p className="text-gray-600 text-sm">
              빈 스냅샷 카드를 생성하여 처음부터 작성합니다.
            </p>
            <div className="mt-4 text-xs text-gray-400">
              v2 스키마 기반 편집 폼
            </div>
          </button>
        </div>

        {/* 향후 기능 안내 */}
        <div className="mt-12 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            이 화면의 모든 데이터는 임시 데이터입니다.
            <br />
            JSON 또는 Plain Text 형식으로 클립보드에 복사하여 사용하세요.
          </p>
        </div>
      </div>

      {/* 데이터 불러오기 모달 */}
      {isLoadModalOpen && (
        <DataLoadModal
          allNames={allNames}
          weekOptions={weekOptions}
          allData={allData}
          onClose={() => setIsLoadModalOpen(false)}
          onLoad={onLoadData}
        />
      )}
    </div>
  );
}

