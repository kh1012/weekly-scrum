"use client";

/**
 * 작업 부담 수준 입력 모달
 * - 스냅샷 저장 시 모달로 표시
 * - 신규 등록/업데이트 버튼 클릭 시 호출
 */

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { WorkloadLevel } from "@/lib/supabase/types";
import { WORKLOAD_LEVEL_LABELS } from "@/lib/supabase/types";
import { LeafIcon, BoltIcon, FireIcon } from "@/components/common/Icons";
import { LoadingButton } from "@/components/common/LoadingButton";
import { formatWeekRangeCompact } from "@/lib/date/isoWeek";

interface WorkloadLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (workloadLevel: WorkloadLevel, workloadNote: string) => void;
  /** 스냅샷 대상 연도 */
  year: number;
  /** 스냅샷 대상 주차 */
  week: number;
  initialLevel?: WorkloadLevel | null;
  initialNote?: string;
  isLoading?: boolean;
  /** 신규 등록 시 true (필수 선택) */
  required?: boolean;
  /** 버튼 텍스트 (신규 등록하기 / 업데이트하기) */
  confirmText?: string;
}

const WORKLOAD_OPTIONS: { value: WorkloadLevel; icon: React.ReactNode; description: string; color: string }[] = [
  { 
    value: "light", 
    icon: <LeafIcon size={24} />, 
    description: "여유롭게 진행 중",
    color: "emerald"
  },
  { 
    value: "normal", 
    icon: <BoltIcon size={24} />, 
    description: "적정 수준으로 진행 중",
    color: "blue"
  },
  { 
    value: "burden", 
    icon: <FireIcon size={24} />, 
    description: "부담되는 상황",
    color: "red"
  },
];

export function WorkloadLevelModal({
  isOpen,
  onClose,
  onConfirm,
  year,
  week,
  initialLevel = null,
  initialNote = "",
  isLoading = false,
  required = false,
  confirmText = "저장하기",
}: WorkloadLevelModalProps) {
  const weekLabel = `W${week.toString().padStart(2, "0")}`;
  const weekRange = formatWeekRangeCompact(year, week);
  const [workloadLevel, setWorkloadLevel] = useState<WorkloadLevel | null>(initialLevel);
  const [workloadNote, setWorkloadNote] = useState(initialNote);
  const [error, setError] = useState(false);

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setWorkloadLevel(initialLevel);
      setWorkloadNote(initialNote);
      setError(false);
    }
  }, [isOpen, initialLevel, initialNote]);

  const handleSelect = useCallback((level: WorkloadLevel) => {
    setWorkloadLevel(level);
    setError(false);
  }, []);

  const handleConfirm = () => {
    if (required && !workloadLevel) {
      setError(true);
      return;
    }
    onConfirm(workloadLevel!, workloadNote);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                지난 주 작업 부담 수준
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {weekLabel} ({weekRange}) 기준으로 선택해주세요
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-5">
          {/* 세그먼트 버튼 */}
          <div
            className={`grid grid-cols-3 gap-3 p-1.5 rounded-xl ${
              error ? "bg-red-50 ring-2 ring-red-200" : "bg-gray-100"
            }`}
          >
            {WORKLOAD_OPTIONS.map((option) => {
              const isSelected = workloadLevel === option.value;
              const colorClasses = {
                emerald: isSelected 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
                blue: isSelected 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
                red: isSelected 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
              };
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={isLoading}
                  className={`
                    relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl
                    transition-all duration-200 text-center
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${colorClasses[option.color as keyof typeof colorClasses]}
                  `}
                >
                  <span className="flex items-center justify-center">
                    {option.icon}
                  </span>
                  <span className="text-sm font-semibold">
                    {WORKLOAD_LEVEL_LABELS[option.value]}
                  </span>
                  <span
                    className={`text-[10px] leading-tight ${
                      isSelected ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              작업 부담 수준을 선택해주세요.
            </p>
          )}

          {/* 한 줄 메모 (선택) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              한 줄 메모 (선택, 최대 80자)
            </label>
            <input
              type="text"
              value={workloadNote}
              onChange={(e) => setWorkloadNote(e.target.value.slice(0, 80))}
              placeholder="예: 다음 주 릴리즈 준비로 바쁨"
              maxLength={80}
              disabled={isLoading}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                         placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50"
            />
            <div className="mt-1 text-right text-[10px] text-gray-400">
              {workloadNote.length}/80
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="text-[11px] text-gray-400 space-y-1.5">
            <p className="flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                리소스 분배와 업무 집중 상태 파악을 위한 참고 자료로 활용됩니다. 솔직한 상황 공유 부탁드립니다.
              </span>
            </p>
            <p className="pl-5 text-gray-300">
              본인과 운영 담당 관리자에게만 공유됩니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <LoadingButton
            onClick={handleConfirm}
            disabled={isLoading || (required && !workloadLevel)}
            isLoading={isLoading}
            loadingText="저장 중..."
            variant="primary"
            size="md"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </div>,
    document.body
  );
}

