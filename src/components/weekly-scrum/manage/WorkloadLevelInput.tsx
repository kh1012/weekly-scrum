"use client";

/**
 * 작업 부담 수준 입력 컴포넌트
 * - 스냅샷 작성/편집 시에만 사용
 * - 세그먼트 버튼 형태의 선택 UI
 */

import { useCallback, ReactNode } from "react";
import type { WorkloadLevel } from "@/lib/supabase/types";
import { WORKLOAD_LEVEL_LABELS } from "@/lib/supabase/types";
import { LeafIcon, BoltIcon, FireIcon } from "@/components/common/Icons";

interface WorkloadLevelInputProps {
  value: WorkloadLevel | null;
  onChange: (value: WorkloadLevel | null) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
  required?: boolean;
  error?: boolean;
}

const WORKLOAD_OPTIONS: { value: WorkloadLevel; icon: ReactNode; description: string }[] = [
  { value: "light", icon: <LeafIcon size={20} />, description: "여유롭게 진행 중" },
  { value: "normal", icon: <BoltIcon size={20} />, description: "적정 수준으로 진행 중" },
  { value: "burden", icon: <FireIcon size={20} />, description: "부담되는 상황" },
];

export function WorkloadLevelInput({
  value,
  onChange,
  note = "",
  onNoteChange,
  required = false,
  error = false,
}: WorkloadLevelInputProps) {
  const handleSelect = useCallback(
    (level: WorkloadLevel) => {
      onChange(value === level ? null : level);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          이번 주 작업 부담 수준
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>

      {/* 세그먼트 버튼 */}
      <div
        className={`grid grid-cols-3 gap-2 p-1 rounded-xl ${
          error ? "bg-red-50 ring-2 ring-red-200" : "bg-gray-100"
        }`}
      >
        {WORKLOAD_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                relative flex flex-col items-center gap-1 px-4 py-3 rounded-lg
                transition-all duration-200 text-center
                ${
                  isSelected
                    ? option.value === "light"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : option.value === "normal"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                }
              `}
            >
              <span className="flex items-center justify-center">{option.icon}</span>
              <span className="text-sm font-semibold">
                {WORKLOAD_LEVEL_LABELS[option.value]}
              </span>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-white/80" : "text-gray-400"
                }`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* 한 줄 메모 (선택) */}
      {onNoteChange && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            한 줄 메모 (선택, 최대 80자)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value.slice(0, 80))}
            placeholder="예: 다음 주 릴리즈 준비로 바쁨"
            maxLength={80}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                       placeholder:text-gray-400"
          />
          <div className="mt-1 text-right text-[10px] text-gray-400">
            {note.length}/80
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
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
          이 항목은 본인과 운영 판단을 담당하는 관리자에게만 공유됩니다.
        </span>
      </p>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          작업 부담 수준을 선택해주세요.
        </p>
      )}
    </div>
  );
}

