/**
 * Gantt Header
 * - Airbnb 스타일 미니멀 헤더
 * - 락 상태 표시
 * - 작업 시작/종료/저장 버튼
 * - 중앙: 보조 액션 (Undo/Redo, 커맨드 팔레트)
 */

"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  CopyIcon,
} from "@/components/common/Icons";
import { ConfirmDiscardModal } from "./ConfirmDiscardModal";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import { showToast, showInactivityWarningToast } from "./Toast";

interface GanttHeaderProps {
  workspaceId: string;
  onCommit: () => Promise<void>;
  isCommitting?: boolean;
  onDiscardChanges?: () => void;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 헤더 제목 */
  title?: string;
  /** 스테이지 필터 상태 */
  selectedStages?: Set<string>;
  /** 스테이지 필터 변경 핸들러 */
  onStagesChange?: (stages: Set<string>) => void;
  /** 담당자 필터 상태 (userId 집합) */
  selectedAssignees?: Set<string>;
  /** 담당자 필터 변경 핸들러 */
  onAssigneesChange?: (assignees: Set<string>) => void;
  /** 담당자 목록 */
  members?: Array<{ userId: string; displayName: string }>;
  /** 필터 로딩 중 상태 */
  isFilterLoading?: boolean;
  /** Plans 최대 updated_at (마지막 업데이트 시각) */
  maxUpdatedAt?: string;
  /** 마지막 업데이트한 사용자 이름 */
  updatedByName?: string;
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
  /** 헤더 숨기기/보이기 토글 */
  onToggleHeader?: () => void;
  /** 자동 저장 옵션 */
  autoSaveEnabled?: boolean;
  onAutoSaveChange?: (enabled: boolean) => void;
  /** 자동 저장 상태 */
  isAutoSaving?: boolean;
}

export function GanttHeader({
  workspaceId,
  onCommit,
  isCommitting = false,
  onDiscardChanges,
  readOnly = false,
  title,
  selectedStages = new Set(),
  onStagesChange,
  selectedAssignees = new Set(),
  onAssigneesChange,
  members = [],
  isFilterLoading = false,
  maxUpdatedAt,
  updatedByName,
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
  onToggleHeader,
  autoSaveEnabled = false,
  onAutoSaveChange,
  isAutoSaving = false,
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

  // URL 복사 핸들러
  const handleCopyURL = useCallback(async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      showToast("success", "URL 복사됨", "클립보드에 복사되었습니다.");
    } catch (err) {
      showToast("error", "복사 실패", "URL을 복사할 수 없습니다.");
    }
  }, []);

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

  // 비활성 경고 토스트 표시
  const shownWarningsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!isMyLock || !isEditing || inactivitySeconds === null) {
      // 편집 종료되거나 락이 없으면 경고 초기화
      shownWarningsRef.current.clear();
      return;
    }

    const INACTIVITY_TIMEOUT = 600; // 10분
    const remainingSeconds = INACTIVITY_TIMEOUT - inactivitySeconds;

    // 3분 남았을 때 (180초)
    if (remainingSeconds <= 180 && remainingSeconds > 60 && !shownWarningsRef.current.has(3)) {
      shownWarningsRef.current.add(3);
      showInactivityWarningToast(3, () => {
        recordActivity();
        extendLockIfNeeded();
        shownWarningsRef.current.clear(); // 연장 후 경고 초기화
      });
    }

    // 1분 남았을 때 (60초)
    if (remainingSeconds <= 60 && remainingSeconds > 0 && !shownWarningsRef.current.has(1)) {
      shownWarningsRef.current.add(1);
      showInactivityWarningToast(1, () => {
        recordActivity();
        extendLockIfNeeded();
        shownWarningsRef.current.clear(); // 연장 후 경고 초기화
      });
    }
  }, [inactivitySeconds, isMyLock, isEditing, recordActivity, extendLockIfNeeded]);

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showRangePopover, setShowRangePopover] = useState(false);
  const [showStagesFilter, setShowStagesFilter] = useState(false);
  const [showAssigneesFilter, setShowAssigneesFilter] = useState(false);
  const [isExtendPressed, setIsExtendPressed] = useState(false);
  const rangePopoverRef = useRef<HTMLDivElement>(null);
  const stagesFilterRef = useRef<HTMLDivElement>(null);
  const assigneesFilterRef = useRef<HTMLDivElement>(null);

  // 필터 로컬 상태 (드롭다운 내부에서만 사용)
  const [localStages, setLocalStages] = useState<Set<string>>(new Set(selectedStages));
  const [localAssignees, setLocalAssignees] = useState<Set<string>>(new Set(selectedAssignees));

  // 드롭다운이 열릴 때만 부모 상태로 초기화
  useEffect(() => {
    if (showStagesFilter) {
      setLocalStages(new Set(selectedStages));
    }
  }, [showStagesFilter, selectedStages]);

  useEffect(() => {
    if (showAssigneesFilter) {
      setLocalAssignees(new Set(selectedAssignees));
    }
  }, [showAssigneesFilter, selectedAssignees]);

  // 스테이지 목록과 색상
  const STAGES = [
    { name: "컨셉 기획", color: "#f59e0b" },
    { name: "상세 기획", color: "#f59e0b" },
    { name: "UI 디자인", color: "#ec4899" },
    { name: "FE 개발", color: "#3b82f6" },
    { name: "BE 개발", color: "#10b981" },
    { name: "QA 검증", color: "#8b5cf6" },
  ];

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        rangePopoverRef.current &&
        !rangePopoverRef.current.contains(e.target as Node)
      ) {
        setShowRangePopover(false);
      }
      if (
        stagesFilterRef.current &&
        !stagesFilterRef.current.contains(e.target as Node)
      ) {
        setShowStagesFilter(false);
      }
      if (
        assigneesFilterRef.current &&
        !assigneesFilterRef.current.contains(e.target as Node)
      ) {
        setShowAssigneesFilter(false);
      }
    };
    if (showRangePopover || showStagesFilter || showAssigneesFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRangePopover, showStagesFilter, showAssigneesFilter]);

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
            <div className="flex items-center gap-3">
              <div>
                <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}>
                  {title || (readOnly ? "계획" : "계획 관리")}
                </h1>
                <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500`}>Feature 단위 일정 계획</p>
              </div>
              {/* 마지막 업데이트 시각 표시 (읽기 전용 모드에서만) */}
              {readOnly && maxUpdatedAt && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 bg-gray-50">
                  <span>Updated</span>
                  <span className="font-semibold text-gray-700">
                    {formatRelativeTime(maxUpdatedAt)}
                  </span>
                  {updatedByName && (
                    <>
                      <span>by</span>
                      <span className="font-semibold text-gray-700">{updatedByName}</span>
                    </>
                  )}
                </div>
              )}
            </div>
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

        {/* 중앙: 필터 + 기간 설정 + 보조 액션 */}
        <div className={`flex items-center gap-3 ${isMobile && readOnly ? "justify-center" : ""}`}>
          {/* 스테이지 필터 */}
          {onStagesChange && (
            <div className="relative" ref={stagesFilterRef}>
              <button
                onClick={() => setShowStagesFilter(!showStagesFilter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedStages.size > 0
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="스테이지 필터"
              >
                <span>스테이지</span>
                {selectedStages.size > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">
                    {selectedStages.size}
                  </span>
                )}
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform ${
                    showStagesFilter ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showStagesFilter && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] z-50 overflow-hidden">
                  <div className="p-2 space-y-1 max-h-[240px] overflow-y-auto">
                    {STAGES.map((stage) => (
                      <label
                        key={stage.name}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={localStages.has(stage.name)}
                          onChange={(e) => {
                            const newStages = new Set(localStages);
                            if (e.target.checked) {
                              newStages.add(stage.name);
                            } else {
                              newStages.delete(stage.name);
                            }
                            setLocalStages(newStages);
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-xs text-gray-700 flex-1">{stage.name}</span>
                      </label>
                    ))}
                  </div>
                  {/* 액션 버튼 */}
                  <div className="border-t border-gray-200 p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setLocalStages(new Set());
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      onClick={() => {
                        onStagesChange(localStages);
                        setShowStagesFilter(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                    >
                      적용
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 담당자 필터 */}
          {onAssigneesChange && members && members.length > 0 && (
            <div className="relative" ref={assigneesFilterRef}>
              <button
                onClick={() => setShowAssigneesFilter(!showAssigneesFilter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedAssignees.size > 0
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="담당자 필터"
              >
                <span>담당자</span>
                {selectedAssignees.size > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white">
                    {selectedAssignees.size}
                  </span>
                )}
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform ${
                    showAssigneesFilter ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showAssigneesFilter && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50 overflow-hidden">
                  <div className="p-2 space-y-1 max-h-[240px] overflow-y-auto">
                    {members.map((member) => (
                      <label
                        key={member.userId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={localAssignees.has(member.userId)}
                          onChange={(e) => {
                            const newAssignees = new Set(localAssignees);
                            if (e.target.checked) {
                              newAssignees.add(member.userId);
                            } else {
                              newAssignees.delete(member.userId);
                            }
                            setLocalAssignees(newAssignees);
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700">{member.displayName}</span>
                      </label>
                    ))}
                  </div>
                  {/* 액션 버튼 */}
                  <div className="border-t border-gray-200 p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setLocalAssignees(new Set());
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      onClick={() => {
                        onAssigneesChange(localAssignees);
                        setShowAssigneesFilter(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded hover:bg-emerald-600 transition-colors"
                    >
                      적용
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(onStagesChange || (onAssigneesChange && members && members.length > 0)) && (
            <div className="w-px h-5 bg-gray-200" />
          )}

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

              {/* URL 복사 버튼 */}
              <HeaderButton
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={handleCopyURL}
                tooltip="URL 복사"
              />

              {/* 도움말 - 읽기 전용에서는 숨김 */}
              {!readOnly && onOpenHelp && (
                <HeaderButton
                  icon={<HelpIcon className="w-4 h-4" />}
                  onClick={onOpenHelp}
                  tooltip="도움말 (?)"
                />
              )}
              {onToggleHeader && (
                <HeaderButton
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  }
                  onClick={onToggleHeader}
                  tooltip="헤더 숨기기 (👁️‍🗨️)"
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
                {/* 자동 저장 체크박스 */}
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group relative"
                  title="자동 저장 (90초 비활성 시 자동 저장)"
                >
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => onAutoSaveChange?.(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {/* 자동 저장 카운트다운 */}
                  {autoSaveEnabled && inactivitySeconds !== null && inactivitySeconds < 90 && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-600 tabular-nums">
                      {90 - inactivitySeconds}초
                    </span>
                  )}
                  {isAutoSaving && (
                    <LoadingIcon className="w-3 h-3 text-emerald-600 animate-spin" />
                  )}
                </label>

                {/* 저장 */}
                <button
                  onClick={onCommit}
                  disabled={!hasUnsavedChanges || isCommitting || isAutoSaving}
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
                  {isCommitting || isAutoSaving ? (
                    <LoadingIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4" />
                  )}
                  {isAutoSaving ? "자동 저장 중..." : isCommitting ? "저장 중..." : "저장"}
                  {hasUnsavedChanges && !isCommitting && !isAutoSaving && changesCount > 0 && (
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
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  tooltip?: string;
}

function HeaderButton({ icon, onClick, disabled, tooltip }: HeaderButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    // 이벤트 전파 방지 (편집 모드 종료 방지)
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
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
