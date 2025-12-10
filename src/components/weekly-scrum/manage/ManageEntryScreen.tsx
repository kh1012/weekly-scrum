"use client";

/**
 * 스냅샷 관리 초기 진입 화면 - Airbnb 스타일
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
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="max-w-3xl w-full px-4">
        {/* 헤더 - Airbnb 스타일 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 mb-6 shadow-lg shadow-rose-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            스냅샷 관리
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            매주 스냅샷을 더 빠르고 편하게 작성하세요
          </p>
        </div>

        {/* 진입점 카드들 - Airbnb 스타일 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 데이터 불러오기 */}
          <button
            onClick={() => setIsLoadModalOpen(true)}
            className="group relative p-8 bg-white rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
          >
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    데이터 불러오기
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    기존 스냅샷 편집
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                이름 또는 주차 기준으로 기존 스냅샷을 불러와서 편집합니다.
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">{allNames.length}명</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{weekOptions.length}주차</span>
                </div>
              </div>
            </div>
            
            {/* 화살표 */}
            <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* 새로 작성하기 */}
          <button
            onClick={onNewSnapshot}
            className="group relative p-8 bg-white rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
          >
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    새로 작성하기
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    빈 스냅샷 생성
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                빈 스냅샷 카드를 생성하여 처음부터 작성합니다.
              </p>
              
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  v2 스키마
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  편집 폼 지원
                </span>
              </div>
            </div>
            
            {/* 화살표 */}
            <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* 안내 문구 - Airbnb 스타일 */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            모든 데이터는 임시 저장됩니다 · JSON 또는 Plain Text로 복사하여 사용하세요
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
