"use client";

/**
 * 새 스냅샷 작성 모달
 *
 * 공통 컴포넌트로 분리하여 PersonalDashboard와 SnapshotsMainView에서 재사용
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatWeekRange } from "@/lib/date/isoWeek";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LoadingButton, SmallLoadingSpinner } from "@/components/common/LoadingButton";

interface NewSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  week: number;
  onLoadExistingData: () => void;
  onCreateEmpty: () => void;
  /** 현재 주차에 스냅샷 데이터가 존재하는지 여부 */
  hasCurrentWeekData?: boolean;
}

export function NewSnapshotModal({
  isOpen,
  onClose,
  year,
  week,
  onLoadExistingData,
  onCreateEmpty,
  hasCurrentWeekData = false,
}: NewSnapshotModalProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCreatingEmpty, setIsCreatingEmpty] = useState(false);

  if (!isOpen) return null;

  const weekRange = formatWeekRange(year, week);

  const handleGoToManagement = () => {
    setIsNavigating(true);
    onClose();
    // 현재 주차 정보를 localStorage에 저장하여 스냅샷 관리 페이지에서 해당 주차 선택
    try {
      const stateToSave = {
        selectedYear: year,
        selectedWeek: week,
        viewMode: "grid",
      };
      localStorage.setItem("snapshots-main-view-state", JSON.stringify(stateToSave));
    } catch {
      // localStorage 사용 불가 시 무시
    }
    navigationProgress.start();
    router.push("/manage/snapshots");
  };

  const handleLoadData = () => {
    setIsLoadingData(true);
    onLoadExistingData();
  };

  const handleCreateEmpty = () => {
    setIsCreatingEmpty(true);
    onCreateEmpty();
  };

  // 현재 주차에 데이터가 존재하는 경우 안내 화면 표시
  if (hasCurrentWeekData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 배경 오버레이 - 블러 강화 */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        />

        {/* 모달 콘텐츠 */}
        <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-10 animate-fadeIn">
          {/* 배경 장식 */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl" />

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 duration-300"
          >
            <svg
              className="w-5 h-5"
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

          {/* 콘텐츠 */}
          <div className="relative text-center">
            {/* 아이콘 */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            {/* 메시지 */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              이번 주 스냅샷이 이미 존재합니다
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-8">
              <span className="font-medium text-gray-900">스냅샷 관리</span>에서 기존 스냅샷을 확인하고 수정하세요.
            </p>

            {/* 버튼 영역 */}
            <LoadingButton
              onClick={handleGoToManagement}
              isLoading={isNavigating}
              loadingText="이동 중..."
              variant="primary"
              size="lg"
              fullWidth
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            >
              스냅샷 관리로 이동하기
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 - 블러 강화 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl md:rounded-[2rem] shadow-2xl max-w-2xl w-full p-6 md:p-10 animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* 배경 장식 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 duration-300"
        >
          <svg
            className="w-5 h-5"
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

        {/* 헤더 */}
        <div className="relative text-center mb-6 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 text-rose-600 text-[11px] md:text-xs font-semibold mb-3 md:mb-4">
            <span>✨</span>
            <span>새 스냅샷 작성 방법을 선택하세요</span>
          </div>
          <p className="text-sm md:text-base text-gray-500">
            {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
          </p>
        </div>

        {/* 선택 카드 */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* 데이터 불러오기 */}
          <button
            onClick={handleLoadData}
            disabled={isLoadingData || isCreatingEmpty}
            className="group relative p-5 md:p-7 bg-white rounded-xl md:rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                {isLoadingData ? (
                  <SmallLoadingSpinner size="md" className="text-white" />
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                {isLoadingData ? "불러오는 중..." : "데이터 불러오기"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                이전 주차의 데이터를 복사하여 시작합니다. 프로젝트 이력이
                유지됩니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isLoadingData && (
              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* 새로 작성하기 */}
          <button
            onClick={handleCreateEmpty}
            disabled={isLoadingData || isCreatingEmpty}
            className="group relative p-5 md:p-7 bg-white rounded-xl md:rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-5 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                {isCreatingEmpty ? (
                  <SmallLoadingSpinner size="md" className="text-white" />
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                {isCreatingEmpty ? "생성 중..." : "새로 작성하기"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                빈 스냅샷으로 시작합니다. 편집 화면에서 새로 입력합니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isCreatingEmpty && (
              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

