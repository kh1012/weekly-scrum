/**
 * Gantt Header
 * - Airbnb 스타일 미니멀 헤더
 * - 락 상태 표시
 * - 작업 시작/종료/저장 버튼
 * - 중앙: 보조 액션 (Undo/Redo, 커맨드 팔레트)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useDraftStore } from "./store";
import { useLock } from "./useLock";
import { useIsMac } from "./useOS";
import {
  LockClosedIcon,
  LockOpenIcon,
  SaveIcon,
  PlayIcon,
  StopIcon,
  LoadingIcon,
  UndoIcon,
  RedoIcon,
  HelpIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "@/components/common/Icons";
import { ConfirmDiscardModal } from "./ConfirmDiscardModal";

interface GanttHeaderProps {
  workspaceId: string;
  onCommit: () => Promise<void>;
  isCommitting?: boolean;
  onDiscardChanges?: () => void;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 헤더 제목 */
  title?: string;
  // 중앙 액션 관련
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenHelp?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** 드래그 중인 기간 정보 */
  dragInfo?: { startDate: string; endDate: string } | null;
  /** 기간 범위 설정 */
  rangeMonths?: number;
  onRangeMonthsChange?: (months: number) => void;
  rangeStart?: Date;
  rangeEnd?: Date;
  /** 커스텀 범위 설정 */
  onCustomRangeChange?: (startDate: Date, endDate: Date) => void;
  /** 락 관련 오류 콜백 */
  onLockError?: (type: "locked_by_other" | "unknown", lockedByName?: string) => void;
  /** 작업 시작 성공 콜백 */
  onStartSuccess?: () => void;
  /** 작업 종료 성공 콜백 (폐기된 변경사항 개수 전달) */
  onStopSuccess?: (discardedCount: number) => void;
}

export function GanttHeader({
  workspaceId,
  onCommit,
  isCommitting = false,
  onDiscardChanges,
  readOnly = false,
  title,
  onUndo,
  onRedo,
  onOpenCommandPalette,
  onOpenHelp,
  canUndo = false,
  canRedo = false,
  dragInfo,
  rangeMonths = 3,
  onRangeMonthsChange,
  rangeStart,
  rangeEnd,
  onCustomRangeChange,
  onLockError,
  onStartSuccess,
  onStopSuccess,
}: GanttHeaderProps) {
  const {
    lockState,
    isMyLock,
    startEditing,
    stopEditing,
    extendLockIfNeeded,
    recordActivity,
    nextHeartbeatSeconds,
    inactivitySeconds,
  } = useLock({ workspaceId });

  const isMac = useIsMac();
  const modKey = isMac ? "⌘" : "Ctrl";

  // 모바일 감지 (768px 이하)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());
  const isEditing = useDraftStore((s) => s.ui.isEditing);
  // 계획(bars) + 깃발(flags) 변경사항 개수
  const changesCount = useDraftStore(
    (s) => s.bars.filter((b) => b.dirty).length + s.flags.filter((f) => f.dirty).length
  );

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showRangePopover, setShowRangePopover] = useState(false);
  const [isExtendPressed, setIsExtendPressed] = useState(false);
  const rangePopoverRef = useRef<HTMLDivElement>(null);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        rangePopoverRef.current &&
        !rangePopoverRef.current.contains(e.target as Node)
      ) {
        setShowRangePopover(false);
      }
    };
    if (showRangePopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRangePopover]);

  // 날짜 포맷
  const formatRangeLabel = () => {
    if (!rangeStart || !rangeEnd) return `${rangeMonths}개월`;
    const startLabel = `${rangeStart.getFullYear()}.${String(
      rangeStart.getMonth() + 1
    ).padStart(2, "0")}`;
    const endLabel = `${rangeEnd.getFullYear()}.${String(
      rangeEnd.getMonth() + 1
    ).padStart(2, "0")}`;
    return `${startLabel} ~ ${endLabel}`;
  };

  const handleStartEditing = async () => {
    setIsStarting(true);
    try {
      const success = await startEditing();
      if (success) {
        onStartSuccess?.();
      } else {
        if (lockState.isLocked && !lockState.isMyLock) {
          onLockError?.("locked_by_other", lockState.lockedByName);
        } else {
          onLockError?.("unknown");
        }
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopEditing = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      doStopEditing(0); // 변경사항 없이 종료
    }
  };

  const doStopEditing = async (discardedCount?: number) => {
    setIsStopping(true);
    try {
      // 폐기될 변경사항 개수 저장 (아직 폐기 전)
      const countToDiscard = discardedCount ?? changesCount;
      // 변경사항 폐기
      onDiscardChanges?.();
      await stopEditing();
      // 종료 성공 콜백
      onStopSuccess?.(countToDiscard);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <>
      <div
        className={`${
          isMobile && readOnly 
            ? "flex flex-col items-center gap-3 px-4 py-3" 
            : "flex items-center justify-between px-5 py-4"
        } border-b transition-all duration-300`}
        style={{
          background: isEditing
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)"
            : "white",
          borderColor: isEditing ? "rgba(16, 185, 129, 0.2)" : "#e5e7eb",
        }}
      >
        {/* 좌측: 제목 + 락 상태 */}
        <div className={`flex items-center gap-4 ${isMobile && readOnly ? "justify-center" : ""}`}>
          <div className={isMobile && readOnly ? "text-center" : ""}>
            <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}>
              {title || (readOnly ? "계획" : "계획 관리")}
            </h1>
            <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500`}>Feature 단위 일정 계획</p>
          </div>

          {/* 락 상태 - 읽기 전용에서는 숨김 */}
          {!readOnly && <div className="h-8 w-px bg-gray-200" />}

          {!readOnly && lockState.isLocked ? (
            <div className="flex items-center gap-2">
              {/* 편집 상태 영역 - 2줄, 고정폭 */}
              {isMyLock && isEditing ? (
                <div
                  className="flex flex-col justify-center"
                  style={{ width: 124 }}
                >
                  {/* 1행: 편집 중 · 다음 갱신 */}
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "#059669" }}
                  >
                    <LockClosedIcon className="w-3 h-3 flex-shrink-0" />
                    <span>편집 중 · 갱신 {String(nextHeartbeatSeconds ?? 0).padStart(2, "0")}초</span>
                  </div>
                  {/* 2행: 비활성 시간 */}
                  <div
                    className="flex items-center gap-1 text-[10px] font-medium mt-0.5"
                    style={{
                      color: inactivitySeconds !== null && inactivitySeconds > 540 
                        ? "#dc2626" 
                        : inactivitySeconds !== null && inactivitySeconds > 300 
                          ? "#d97706" 
                          : "#6b7280",
                    }}
                    title="10분간 활동이 없으면 자동으로 편집이 종료됩니다"
                  >
                    <span className="ml-[18px]">
                      비활성 {inactivitySeconds !== null ? `${Math.floor(inactivitySeconds / 60)}:${String(inactivitySeconds % 60).padStart(2, "0")}` : "0:00"}
                    </span>
                    <span className="opacity-50">/ 10:00</span>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: isMyLock
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%)"
                      : "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%)",
                    color: isMyLock ? "#059669" : "#dc2626",
                  }}
                >
                  <LockClosedIcon className="w-3.5 h-3.5" />
                  <span>{lockState.lockedByName || "다른 사용자"} 작업 중</span>
                </div>
              )}
              {/* 연장하기 버튼 - 내가 편집 중일 때만 */}
              {isMyLock && isEditing && (
                <button
                  onClick={() => {
                    recordActivity();
                    extendLockIfNeeded();
                  }}
                  onMouseDown={() => setIsExtendPressed(true)}
                  onMouseUp={() => setIsExtendPressed(false)}
                  onMouseLeave={() => setIsExtendPressed(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 active:scale-95"
                  title="비활성 시간 초기화 및 락 연장"
                  style={{ 
                    color: "#059669",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    transform: isExtendPressed ? "scale(0.92)" : "scale(1)",
                  }}
                >
                  연장
                </button>
              )}
            </div>
          ) : !readOnly ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(107, 114, 128, 0.1)",
                color: "#6b7280",
              }}
            >
              <LockOpenIcon className="w-3.5 h-3.5" />
              <span>편집 가능</span>
            </div>
          ) : null}
        </div>

        {/* 중앙: 기간 설정 + 보조 액션 */}
        <div className={`flex items-center gap-3 ${isMobile && readOnly ? "justify-center" : ""}`}>
          {/* 기간 설정 버튼 */}
          <div className="relative" ref={rangePopoverRef}>
            <button
              onClick={() => setShowRangePopover(!showRangePopover)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
              style={{ color: "#374151" }}
            >
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <span>{formatRangeLabel()}</span>
              <ChevronDownIcon
                className={`w-3 h-3 transition-transform ${
                  showRangePopover ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 기간 설정 팝오버 */}
            {showRangePopover && (
              <RangePopover
                rangeMonths={rangeMonths}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeMonthsChange={(months) => {
                  onRangeMonthsChange?.(months);
                  setShowRangePopover(false);
                }}
                onCustomRangeChange={(start, end) => {
                  onCustomRangeChange?.(start, end);
                  setShowRangePopover(false);
                }}
                onClose={() => setShowRangePopover(false)}
              />
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* 보조 액션 */}
          {dragInfo ? (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "white",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              <span className="text-xs opacity-80">📅</span>
              <span>{dragInfo.startDate}</span>
              <span className="opacity-60">→</span>
              <span>{dragInfo.endDate}</span>
            </div>
          ) : (
            <>
              {/* Undo/Redo (편집 모드일 때만) */}
              {isEditing && (
                <>
                  <HeaderButton
                    icon={<UndoIcon className="w-4 h-4" />}
                    onClick={onUndo}
                    disabled={!canUndo}
                    tooltip="실행 취소 (⌘Z)"
                  />
                  <HeaderButton
                    icon={<RedoIcon className="w-4 h-4" />}
                    onClick={onRedo}
                    disabled={!canRedo}
                    tooltip="다시 실행 (⌘⇧Z)"
                  />
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                </>
              )}

              {/* 커맨드 팔레트 */}
              <button
                onClick={onOpenCommandPalette}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all hover:bg-gray-100"
                style={{ color: "#6b7280" }}
              >
                <span className="opacity-70">{modKey}</span>
                {!isMac && <span className="opacity-50">+</span>}
                <span>K</span>
              </button>

              {/* 도움말 - 읽기 전용에서는 숨김 */}
              {!readOnly && onOpenHelp && (
                <HeaderButton
                  icon={<HelpIcon className="w-4 h-4" />}
                  onClick={onOpenHelp}
                  tooltip="도움말 (?)"
                />
              )}
            </>
          )}
        </div>

        {/* 우측: 주요 액션 버튼 - 읽기 전용에서는 숨김 */}
        {!readOnly && (
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleStartEditing}
                disabled={isStarting || (lockState.isLocked && !isMyLock)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                }}
              >
                {isStarting ? (
                  <LoadingIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                {isStarting ? "시작 중..." : "작업 시작"}
              </button>
            ) : (
              <>
                {/* 저장 */}
                <button
                  onClick={onCommit}
                  disabled={!hasUnsavedChanges || isCommitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    background: hasUnsavedChanges
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "#e5e7eb",
                    color: hasUnsavedChanges ? "white" : "#9ca3af",
                    boxShadow: hasUnsavedChanges
                      ? "0 4px 14px rgba(16, 185, 129, 0.4)"
                      : "none",
                  }}
                >
                  {isCommitting ? (
                    <LoadingIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4" />
                  )}
                  {isCommitting ? "저장 중..." : "저장"}
                  {hasUnsavedChanges && !isCommitting && changesCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                    >
                      {changesCount}
                    </span>
                  )}
                </button>

                {/* 작업 종료 */}
                <button
                  onClick={handleStopEditing}
                  disabled={isStopping}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{
                    background: "white",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {isStopping ? (
                    <LoadingIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <StopIcon className="w-4 h-4" />
                  )}
                  {isStopping ? "종료 중..." : "작업 종료"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 변경사항 폐기 확인 모달 */}
      <ConfirmDiscardModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={() => doStopEditing(changesCount)}
        onSaveAndClose={async () => {
          await onCommit();
          await doStopEditing(0); // 저장 후에는 폐기된 것 없음
        }}
        changesCount={changesCount}
      />
    </>
  );
}

// 헤더용 버튼 컴포넌트
interface HeaderButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

function HeaderButton({ icon, onClick, disabled, tooltip }: HeaderButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg transition-all hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: "#6b7280" }}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

// 기간 설정 팝오버 컴포넌트
interface RangePopoverProps {
  rangeMonths: number;
  rangeStart?: Date;
  rangeEnd?: Date;
  onRangeMonthsChange: (months: number) => void;
  onCustomRangeChange: (start: Date, end: Date) => void;
  onClose: () => void;
}

// 커스텀 드롭다운 컴포넌트
interface CustomDropdownProps {
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}

function CustomDropdown({ value, options, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
        style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
      >
        <span className="font-medium text-gray-700">
          {selectedOption?.label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                option.value === value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
              {option.value === value && (
                <span className="float-right text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RangePopover({
  rangeMonths,
  rangeStart,
  rangeEnd,
  onRangeMonthsChange,
  onCustomRangeChange,
}: RangePopoverProps) {
  // rangeMonths가 0이면 커스텀 모드 → 직접 선택 탭을 기본으로
  const isCustomMode = rangeMonths === 0;
  const [activeTab, setActiveTab] = useState<"preset" | "custom">(
    isCustomMode ? "custom" : "preset"
  );
  
  // 초기값 설정 (undefined/null 체크, 0도 유효한 값으로 처리)
  const [customStartYear, setCustomStartYear] = useState(
    rangeStart ? rangeStart.getFullYear() : new Date().getFullYear()
  );
  const [customStartMonth, setCustomStartMonth] = useState(
    rangeStart ? rangeStart.getMonth() + 1 : new Date().getMonth() + 1
  );
  const [customEndYear, setCustomEndYear] = useState(
    rangeEnd ? rangeEnd.getFullYear() : new Date().getFullYear()
  );
  const [customEndMonth, setCustomEndMonth] = useState(
    rangeEnd ? rangeEnd.getMonth() + 1 : new Date().getMonth() + 1
  );

  const currentYear = new Date().getFullYear();
  // 현재 연도 기준 -1년 ~ +2년 범위 제공
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(
    (y) => ({
      value: y,
      label: `${y}년`,
    })
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}월`,
  }));

  const handleApplyCustomRange = () => {
    const start = new Date(
      customStartYear,
      customStartMonth - 1,
      1,
      0,
      0,
      0,
      0
    );
    const end = new Date(customEndYear, customEndMonth, 0, 0, 0, 0, 0); // 마지막 날
    onCustomRangeChange(start, end);
  };

  return (
    <div
      className="absolute top-full left-0 mt-2 rounded-xl shadow-xl z-50"
      style={{
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        minWidth: 280,
      }}
    >
      {/* 탭 헤더 */}
      <div
        className="flex border-b rounded-t-xl overflow-hidden"
        style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}
      >
        <button
          onClick={() => setActiveTab("preset")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === "preset"
              ? "text-blue-600 border-b border-blue-500 bg-blue-50/50"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          기본 기간
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === "custom"
              ? "text-blue-600 border-b border-blue-500 bg-blue-50/50"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          직접 선택
        </button>
      </div>

      <div className="p-3">
        {activeTab === "preset" ? (
          <>
            <div className="text-xs font-semibold text-gray-500 mb-2 px-1">
              표시 기간 선택
            </div>
            <div className="space-y-1">
              {[3, 4, 5, 6].map((m) => {
                const isSelected = rangeMonths === m;
                return (
                  <button
                    key={m}
                    onClick={() => onRangeMonthsChange(m)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{m}개월</span>
                    {isSelected && <span className="text-blue-500">✓</span>}
                  </button>
                );
              })}
            </div>
            {isCustomMode && (
              <div
                className="mt-3 pt-3 text-xs text-amber-600 text-center font-medium"
                style={{ borderTop: "1px solid #e5e7eb" }}
              >
                ⚠️ 현재 직접 선택 모드 사용 중
              </div>
            )}
            {!isCustomMode && (
              <div
                className="mt-3 pt-3 text-xs text-gray-400 text-center"
                style={{ borderTop: "1px solid #e5e7eb" }}
              >
                현재 기준 전후 기간 표시
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* 시작월 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  시작월
                </label>
                <div className="flex gap-2">
                  <CustomDropdown
                    value={customStartYear}
                    options={yearOptions}
                    onChange={setCustomStartYear}
                  />
                  <CustomDropdown
                    value={customStartMonth}
                    options={monthOptions}
                    onChange={setCustomStartMonth}
                  />
                </div>
              </div>

              {/* 끝월 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  종료월
                </label>
                <div className="flex gap-2">
                  <CustomDropdown
                    value={customEndYear}
                    options={yearOptions}
                    onChange={setCustomEndYear}
                  />
                  <CustomDropdown
                    value={customEndMonth}
                    options={monthOptions}
                    onChange={setCustomEndMonth}
                  />
                </div>
              </div>

              {/* 적용 버튼 */}
              <button
                onClick={handleApplyCustomRange}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                적용
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
