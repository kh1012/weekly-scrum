"use client";

/**
 * 새 스냅샷 작성 모달
 *
 * 공통 컴포넌트로 분리하여 PersonalDashboard와 SnapshotsMainView에서 재사용
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatWeekRange } from "@/lib/utils/date";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LoadingButton, SmallLoadingSpinner } from "@/components/common/LoadingButton";

// 기존 주차별 데이터 타입
interface WeekData {
  key: string;
  year: number;
  week: string;
  weekStartDate: string;
  weekEndDate: string;
  entriesCount: number;
}

interface NewSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  week: number;
  onLoadExistingData: (selectedWeekKeys: string[]) => void;
  onCreateEmpty: () => void;
  /** 현재 주차에 스냅샷 데이터가 존재하는지 여부 */
  hasCurrentWeekData?: boolean;
  /** 데이터 불러오기를 위한 워크스페이스 ID */
  workspaceId?: string;
  /** 데이터 불러오기를 위한 사용자 ID */
  userId?: string;
}

export function NewSnapshotModal({
  isOpen,
  onClose,
  year,
  week,
  onLoadExistingData,
  onCreateEmpty,
  hasCurrentWeekData = false,
  workspaceId,
  userId,
}: NewSnapshotModalProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCreatingEmpty, setIsCreatingEmpty] = useState(false);
  
  // 모달 모드: 'choice' (초기 선택), 'loading' (주차 선택)
  const [modalMode, setModalMode] = useState<"choice" | "loading">("choice");
  
  // 주차 데이터
  const [myWeeklyData, setMyWeeklyData] = useState<WeekData[]>([]);
  const [isFetchingWeeks, setIsFetchingWeeks] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());

  // 모달이 열릴 때 modalMode를 초기화
  useEffect(() => {
    if (isOpen) {
      setModalMode("choice");
      setSelectedWeeks(new Set());
      setMyWeeklyData([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const weekRange = formatWeekRange(year, week);
  
  // 주차 데이터 불러오기
  const fetchMyWeeklyData = async () => {
    if (!workspaceId || !userId) return;
    
    setIsFetchingWeeks(true);
    try {
      const response = await fetch(
        `/api/manage/snapshots/my-entries?workspaceId=${workspaceId}&userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMyWeeklyData(data.weeks || []);
      }
    } catch (error) {
      console.error("Failed to fetch my entries:", error);
    } finally {
      setIsFetchingWeeks(false);
    }
  };

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
    // 주차 선택 모드로 전환하고 데이터 로드
    setModalMode("loading");
    fetchMyWeeklyData();
  };

  const handleCreateEmpty = () => {
    setIsCreatingEmpty(true);
    onCreateEmpty();
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
  
  // 불러오기 확정
  const handleConfirmLoad = () => {
    setIsLoadingData(true);
    const weekKeys = Array.from(selectedWeeks);
    onLoadExistingData(weekKeys);
  };

  // 현재 주차에 데이터가 존재하는 경우 안내 화면 표시
  if (hasCurrentWeekData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 배경 오버레이 */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 모달 콘텐츠 */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-fadeIn">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-amber-500 flex items-center justify-center">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              이번 주 스냅샷이 이미 존재합니다
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              <span className="font-medium text-blue-600">스냅샷 관리</span>에서 기존 스냅샷을 확인하고 수정하세요.
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

  // 주차 선택 모드
  if (modalMode === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 배경 오버레이 */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 모달 콘텐츠 - 주차 선택 */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-fadeIn">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
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
          <div className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>데이터 불러오기</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              불러올 주차를 선택하세요
            </p>
          </div>

          {/* 주차 목록 */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {isFetchingWeeks ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : myWeeklyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">저장된 스냅샷이 없습니다</p>
                <p className="text-xs text-gray-500">새로 작성하기로 시작해보세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 전체 선택 버튼 */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedWeeks.size}/{myWeeklyData.length}개 선택됨
                  </span>
                  <button
                    onClick={() => {
                      if (selectedWeeks.size === myWeeklyData.length) {
                        setSelectedWeeks(new Set());
                      } else {
                        setSelectedWeeks(new Set(myWeeklyData.map((w) => w.key)));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {selectedWeeks.size === myWeeklyData.length ? "전체 해제" : "전체 선택"}
                  </button>
                </div>

                {/* 주차 리스트 */}
                {myWeeklyData.map((weekData) => {
                  const isSelected = selectedWeeks.has(weekData.key);
                  return (
                    <label
                      key={weekData.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleWeek(weekData.key)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {weekData.year}년 {weekData.week}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded">
                            {weekData.entriesCount}개
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">
                          {weekData.weekStartDate} ~ {weekData.weekEndDate}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-6 md:px-8 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              onClick={() => setModalMode("choice")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              뒤로
            </button>
            <LoadingButton
              onClick={handleConfirmLoad}
              disabled={selectedWeeks.size === 0 || isLoadingData}
              isLoading={isLoadingData}
              loadingText="불러오는 중..."
              variant="primary"
              size="md"
            >
              불러오기 ({selectedWeeks.size})
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  }

  // 초기 선택 모드
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 md:p-8 animate-fadeIn">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[11px] md:text-xs font-semibold mb-3">
            <span>✨</span>
            <span>새 스냅샷 작성 방법을 선택하세요</span>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
          </p>
        </div>

        {/* 선택 카드 */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* 데이터 불러오기 */}
          <button
            onClick={handleLoadData}
            disabled={isLoadingData || isCreatingEmpty}
            className="group relative p-4 md:p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-lg bg-blue-500 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
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
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {isLoadingData ? "불러오는 중..." : "데이터 불러오기"}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                이전 주차의 데이터를 복사하여 시작합니다. 프로젝트 이력이
                유지됩니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isLoadingData && (
              <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-blue-500 transition-colors">
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
            className="group relative p-4 md:p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-lg bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
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
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {isCreatingEmpty ? "생성 중..." : "새로 작성하기"}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                빈 스냅샷으로 시작합니다. 편집 화면에서 새로 입력합니다.
              </p>
            </div>
            {/* 화살표 */}
            {!isCreatingEmpty && (
              <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-emerald-500 transition-colors">
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

