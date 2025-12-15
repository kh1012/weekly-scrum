"use client";

/**
 * 스냅샷 카드 리스트 - Airbnb 스타일
 *
 * 기능:
 * - 더블클릭으로 카드 확장/축소
 * - 우클릭 컨텍스트 메뉴 (복사, 삭제)
 * - 부드러운 애니메이션
 */

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import type { TempSnapshot } from "./types";

export interface SnapshotCardListRef {
  expandCard: (tempId: string) => void;
}

interface SnapshotCardListProps {
  snapshots: TempSnapshot[];
  selectedId: string | null;
  onSelectCard: (tempId: string) => void;
  onDeleteCard: (tempId: string) => void;
  onDuplicateCard: (tempId: string) => void;
  onCopyJson: (snapshot: TempSnapshot) => void;
  onCopyPlainText: (snapshot: TempSnapshot) => void;
  onAddEmpty: () => void;
  onCopyAllJson: () => void;
  onCopyAllPlainText: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  snapshot: TempSnapshot;
}

export const SnapshotCardList = forwardRef<
  SnapshotCardListRef,
  SnapshotCardListProps
>(function SnapshotCardList(
  {
    snapshots,
    selectedId,
    onSelectCard,
    onDeleteCard,
    onDuplicateCard,
    onCopyJson,
    onCopyPlainText,
    onAddEmpty,
    onCopyAllJson,
    onCopyAllPlainText,
  },
  ref
) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [optionMenuId, setOptionMenuId] = useState<string | null>(null);
  const [optionMenuPosition, setOptionMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const optionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // 일괄 선택 모드
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 외부에서 카드 확장 제어
  useImperativeHandle(ref, () => ({
    expandCard: (tempId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(tempId);
        return next;
      });
    },
  }));

  const toggleExpand = useCallback((tempId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  }, []);

  // 더블클릭 핸들러
  const handleDoubleClick = useCallback(
    (tempId: string) => {
      toggleExpand(tempId);
    },
    [toggleExpand]
  );

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, snapshot: TempSnapshot) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        snapshot,
      });
    },
    []
  );

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 옵션 메뉴 열기
  const handleOpenOptionMenu = useCallback((e: React.MouseEvent, tempId: string) => {
    e.stopPropagation();
    const button = optionButtonRefs.current[tempId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setOptionMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 160, // 메뉴 너비 160px
      });
    }
    setOptionMenuId((prev) => (prev === tempId ? null : tempId));
  }, []);

  // 옵션 메뉴 닫기
  const closeOptionMenu = useCallback(() => {
    setOptionMenuId(null);
  }, []);

  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = () => setIsCopyDropdownOpen(false);
    if (isCopyDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isCopyDropdownOpen]);

  // 옵션 메뉴 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = () => setOptionMenuId(null);
    if (optionMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [optionMenuId]);

  // 일괄 선택 토글
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  // 개별 카드 선택/해제
  const toggleCardSelection = useCallback((tempId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  }, []);

  // 전체 선택/해제
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === snapshots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(snapshots.map((s) => s.tempId)));
    }
  }, [selectedIds.size, snapshots]);

  // 선택된 카드 일괄 삭제
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(`${selectedIds.size}개의 카드를 삭제하시겠습니까?`);
    if (confirmed) {
      selectedIds.forEach((id) => onDeleteCard(id));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  }, [selectedIds, onDeleteCard]);

  // 드롭다운 열릴 때 위치 계산
  const handleOpenDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyButtonRef.current) {
      const rect = copyButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsCopyDropdownOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0" onClick={closeContextMenu}>
      {/* 리스트 헤더 - 1줄 */}
      <div className="h-12 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm shrink-0 flex items-center justify-between">
        {/* 좌측: 타이틀 또는 선택 모드 */}
        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedIds.size === snapshots.length && snapshots.length > 0
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}>
                  {selectedIds.size === snapshots.length && snapshots.length > 0 && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                전체
              </button>
              <span className="text-xs text-blue-600 font-medium">{selectedIds.size}개</span>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-gray-800">카드 목록</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{snapshots.length}</span>
            </>
          )}
        </div>
        {/* 우측: 선택/복사/추가 버튼 */}
        <div className="flex items-center gap-1">
            {/* 선택 모드 토글 */}
            {snapshots.length > 0 && (
              <button
                onClick={toggleSelectMode}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  isSelectMode
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSelectMode ? "취소" : "선택"}
              </button>
            )}
          {/* 전체 복사 드롭다운 */}
          <button
            ref={copyButtonRef}
            onClick={handleOpenDropdown}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all"
          >
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <svg
              className={`w-3 h-3 transition-transform ${
                isCopyDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {/* 드롭다운 메뉴 - Portal로 렌더링 */}
          {isCopyDropdownOpen &&
            createPortal(
              <div
                className="fixed w-36 py-1 bg-white rounded-xl shadow-lg border border-gray-100 z-[9999]"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onCopyAllJson();
                    setIsCopyDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    J
                  </span>
                  JSON 전체
                </button>
                <button
                  onClick={() => {
                    onCopyAllPlainText();
                    setIsCopyDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold">
                    T
                  </span>
                  Text 전체
                </button>
              </div>,
              document.body
            )}
          <button
            onClick={onAddEmpty}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            추가
          </button>
        </div>
      </div>

      {/* 카드 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {snapshots.map((snapshot) => {
          const isSelected = snapshot.tempId === selectedId;
          const isExpanded = expandedIds.has(snapshot.tempId);
          const isChecked = selectedIds.has(snapshot.tempId);

          // 메타 태그 정보
          const metaTags = [
            { label: "Domain", value: snapshot.domain },
            { label: "Project", value: snapshot.project },
            { label: "Module", value: snapshot.module },
            { label: "Feature", value: snapshot.feature },
          ].filter((tag) => tag.value);

          return (
            <div
              key={snapshot.tempId}
              className={`
                relative rounded-2xl border transition-all duration-200 cursor-pointer flex
                ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm"
                    : isChecked
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }
              `}
              onClick={() => isSelectMode ? toggleCardSelection(snapshot.tempId) : onSelectCard(snapshot.tempId)}
              onDoubleClick={() => !isSelectMode && handleDoubleClick(snapshot.tempId)}
              onContextMenu={(e) => !isSelectMode && handleContextMenu(e, snapshot)}
            >
              {/* 선택 모드 체크박스 */}
              {isSelectMode && (
                <div className="flex items-center justify-center pl-3 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isChecked
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              {/* 카드 내용 */}
              <div className="flex-1 min-w-0">
                {/* 카드 헤더 */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 이름 + 상태 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* 아바타 */}
                        <div
                          className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${
                            isSelected
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                        >
                          {snapshot.name ? snapshot.name.charAt(0) : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {snapshot.name || "(이름 없음)"}
                            </span>
                            {snapshot.isDirty && (
                              <span
                                className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"
                                title="수정됨"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-1">
                    {/* 펼치기/접기 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(snapshot.tempId);
                      }}
                      className={`
                        p-1.5 rounded-lg transition-all duration-200
                        ${
                          isExpanded
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }
                      `}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* 옵션 메뉴 버튼 */}
                    <button
                      ref={(el) => { optionButtonRefs.current[snapshot.tempId] = el; }}
                      onClick={(e) => handleOpenOptionMenu(e, snapshot.tempId)}
                      aria-label="옵션"
                      className={`
                        p-1.5 rounded-lg transition-all duration-200
                        ${
                          optionMenuId === snapshot.tempId
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }
                      `}
                    >
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 메타 태그 (여러 줄로 나열) */}
                {metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {metaTags.map((tag, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          tag.label === "Domain"
                            ? "bg-purple-50 text-purple-600"
                            : tag.label === "Project"
                            ? "bg-blue-50 text-blue-600"
                            : tag.label === "Module"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* 상태 태그 */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {snapshot.isOriginal && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">
                      원본
                    </span>
                  )}
                  {snapshot.pastWeek.tasks.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                      {snapshot.pastWeek.tasks.length} tasks
                    </span>
                  )}
                  {snapshot.pastWeek.riskLevel !== null &&
                    snapshot.pastWeek.riskLevel > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          snapshot.pastWeek.riskLevel === 1
                            ? "bg-yellow-50 text-yellow-600"
                            : snapshot.pastWeek.riskLevel === 2
                            ? "bg-orange-50 text-orange-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        Risk {snapshot.pastWeek.riskLevel}
                      </span>
                    )}
                </div>
              </div>

              {/* 펼친 내용 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 animate-fadeIn">
                  <div className="space-y-3">
                    {/* Past Week Tasks */}
                    {snapshot.pastWeek.tasks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          Past Week
                        </div>
                        <ul className="space-y-1.5">
                          {snapshot.pastWeek.tasks.map((task, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  task.progress === 100
                                    ? "bg-emerald-500"
                                    : task.progress >= 50
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <span className="text-gray-700 flex-1">
                                {task.title}
                              </span>
                              <span
                                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  task.progress === 100
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {task.progress}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* This Week Tasks */}
                    {snapshot.thisWeek.tasks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          This Week
                        </div>
                        <ul className="space-y-1.5">
                          {snapshot.thisWeek.tasks.map((task, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-xs text-gray-700"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          );
        })}

        {snapshots.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-2">스냅샷이 없습니다</p>
            <button
              onClick={onAddEmpty}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              빈 카드 추가하기
            </button>
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 min-w-[160px] py-1.5 bg-white rounded-xl shadow-xl border border-gray-100 animate-scale-in"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 180),
            }}
          >
            <button
              onClick={() => {
                onDuplicateCard(contextMenu.snapshot.tempId);
                closeContextMenu();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
              복제
            </button>
            <button
              onClick={() => {
                onCopyJson(contextMenu.snapshot);
                closeContextMenu();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              JSON 복사
            </button>
            <button
              onClick={() => {
                onCopyPlainText(contextMenu.snapshot);
                closeContextMenu();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Plain Text 복사
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={() => {
                onDeleteCard(contextMenu.snapshot.tempId);
                closeContextMenu();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
          </div>
        </>
      )}

      {/* 옵션 메뉴 (... 버튼) */}
      {optionMenuId &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[160px] py-1.5 bg-white rounded-xl shadow-xl border border-gray-100 animate-scale-in"
            style={{
              top: optionMenuPosition.top,
              left: Math.max(8, optionMenuPosition.left),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const snapshot = snapshots.find((s) => s.tempId === optionMenuId);
              if (!snapshot) return null;
              return (
                <>
                  <button
                    onClick={() => {
                      onDuplicateCard(snapshot.tempId);
                      closeOptionMenu();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    복제
                  </button>
                  <button
                    onClick={() => {
                      onCopyJson(snapshot);
                      closeOptionMenu();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    JSON 복사
                  </button>
                  <button
                    onClick={() => {
                      onCopyPlainText(snapshot);
                      closeOptionMenu();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Plain Text 복사
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={() => {
                      onDeleteCard(snapshot.tempId);
                      closeOptionMenu();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    삭제
                  </button>
                </>
              );
            })()}
          </div>,
          document.body
        )}
    </div>
  );
});
