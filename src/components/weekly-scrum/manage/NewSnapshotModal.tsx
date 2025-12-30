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
        {/* 배경 오버레이 - GitHub 스타일 */}
        <div
          className="absolute inset-0 bg-[rgba(1,4,9,0.8)] backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 모달 콘텐츠 - GitHub 스타일 */}
        <div className="relative bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl max-w-lg w-full p-8 animate-fadeIn">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg transition-colors"
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
            <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-[#9e6a03] flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
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
            </div>

            {/* 메시지 */}
            <h2 className="text-lg font-semibold text-[#c9d1d9] mb-2">
              이번 주 스냅샷이 이미 존재합니다
            </h2>
            <p className="text-sm text-[#7d8590] mb-2">
              {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
            </p>
            <p className="text-sm text-[#7d8590] leading-relaxed mb-6">
              <span className="font-medium text-[#58a6ff]">스냅샷 관리</span>에서 기존 스냅샷을 확인하고 수정하세요.
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
      {/* 배경 오버레이 - GitHub 스타일 */}
      <div
        className="absolute inset-0 bg-[rgba(1,4,9,0.8)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 - GitHub 스타일 */}
      <div className="relative bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl max-w-2xl w-full p-6 md:p-8 animate-fadeIn">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg transition-colors"
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
        <div className="relative text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#58a6ff] text-[11px] md:text-xs font-semibold mb-3">
            <span>✨</span>
            <span>새 스냅샷 작성 방법을 선택하세요</span>
          </div>
          <p className="text-sm md:text-base text-[#7d8590]">
            {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
          </p>
        </div>

        {/* 선택 카드 - GitHub 스타일 */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* 데이터 불러오기 */}
          <button
            onClick={handleLoadData}
            disabled={isLoadingData || isCreatingEmpty}
            className="group relative p-4 md:p-6 bg-[#161b22] rounded-lg border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#0d1117] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-lg bg-[#1f6feb] flex items-center justify-center group-hover:bg-[#58a6ff] transition-colors">
                {isLoadingData ? (
                  <SmallLoadingSpinner size="md" className="text-white" />
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#c9d1d9] mb-2 group-hover:text-[#58a6ff] transition-colors">
                {isLoadingData ? "불러오는 중..." : "데이터 불러오기"}
              </h3>
              <p className="text-xs md:text-sm text-[#7d8590] leading-relaxed">
                이전 주차의 데이터를 복사하여 시작합니다. 프로젝트 이력이
                유지됩니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isLoadingData && (
              <div className="absolute bottom-4 right-4 text-[#7d8590] group-hover:text-[#58a6ff] transition-colors">
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
            className="group relative p-4 md:p-6 bg-[#161b22] rounded-lg border border-[#30363d] hover:border-[#3fb950] hover:bg-[#0d1117] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-lg bg-[#238636] flex items-center justify-center group-hover:bg-[#3fb950] transition-colors">
                {isCreatingEmpty ? (
                  <SmallLoadingSpinner size="md" className="text-white" />
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#c9d1d9] mb-2 group-hover:text-[#3fb950] transition-colors">
                {isCreatingEmpty ? "생성 중..." : "새로 작성하기"}
              </h3>
              <p className="text-xs md:text-sm text-[#7d8590] leading-relaxed">
                빈 스냅샷으로 시작합니다. 편집 화면에서 새로 입력합니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isCreatingEmpty && (
              <div className="absolute bottom-4 right-4 text-[#7d8590] group-hover:text-[#3fb950] transition-colors">
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

