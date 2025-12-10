"use client";

/**
 * 스냅샷 카드 리스트
 * 
 * 각 카드는 요약 정보를 가지며, 선택/삭제/복사 기능을 제공합니다.
 */

import { useState } from "react";
import type { TempSnapshot } from "./types";
import { tempSnapshotToPlainText } from "./types";

interface SnapshotCardListProps {
  snapshots: TempSnapshot[];
  selectedId: string | null;
  viewMode: "styled" | "plaintext";
  onSelectCard: (tempId: string) => void;
  onDeleteCard: (tempId: string) => void;
  onCopyJson: (snapshot: TempSnapshot) => void;
  onCopyPlainText: (snapshot: TempSnapshot) => void;
  onAddEmpty: () => void;
}

export function SnapshotCardList({
  snapshots,
  selectedId,
  viewMode,
  onSelectCard,
  onDeleteCard,
  onCopyJson,
  onCopyPlainText,
  onAddEmpty,
}: SnapshotCardListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const toggleExpand = (tempId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 리스트 헤더 */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          카드 목록
        </span>
        <button
          onClick={onAddEmpty}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          빈 카드 추가
        </button>
      </div>

      {/* 카드 리스트 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {snapshots.map((snapshot) => {
          const isSelected = snapshot.tempId === selectedId;
          const isExpanded = expandedIds.has(snapshot.tempId);
          const isMenuOpen = menuOpenId === snapshot.tempId;

          // 요약 정보
          const summary = [
            snapshot.domain,
            snapshot.project,
            snapshot.module,
            snapshot.feature,
          ]
            .filter(Boolean)
            .join(" / ");

          return (
            <div
              key={snapshot.tempId}
              className={`relative rounded-lg border transition-colors ${
                isSelected
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* 카드 헤더 */}
              <div
                className="p-3 cursor-pointer"
                onClick={() => onSelectCard(snapshot.tempId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* 이름 */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {snapshot.name || "(이름 없음)"}
                      </span>
                      {snapshot.isDirty && (
                        <span className="w-2 h-2 rounded-full bg-orange-400" title="수정됨" />
                      )}
                      {snapshot.isOriginal && (
                        <span className="text-xs text-gray-400">원본</span>
                      )}
                    </div>
                    {/* 요약 */}
                    <p className="text-xs text-gray-500 truncate">
                      {summary || "(분류 없음)"}
                    </p>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-1">
                    {/* 펼치기/접기 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(snapshot.tempId);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* 더보기 메뉴 */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : snapshot.tempId);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyJson(snapshot);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              JSON 복사
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyPlainText(snapshot);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Plain Text 복사
                            </button>
                            <div className="h-px bg-gray-100 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCard(snapshot.tempId);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 펼친 내용 */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  {viewMode === "styled" ? (
                    <div className="mt-2 space-y-2 text-xs">
                      {/* Past Week Tasks */}
                      {snapshot.pastWeek.tasks.length > 0 && (
                        <div>
                          <span className="text-gray-500">Past Week:</span>
                          <ul className="mt-1 space-y-0.5 text-gray-700">
                            {snapshot.pastWeek.tasks.slice(0, 3).map((task, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-400" />
                                <span className="truncate">{task.title}</span>
                                <span className="text-gray-400">({task.progress}%)</span>
                              </li>
                            ))}
                            {snapshot.pastWeek.tasks.length > 3 && (
                              <li className="text-gray-400">
                                +{snapshot.pastWeek.tasks.length - 3}개 더...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* This Week Tasks */}
                      {snapshot.thisWeek.tasks.length > 0 && (
                        <div>
                          <span className="text-gray-500">This Week:</span>
                          <ul className="mt-1 space-y-0.5 text-gray-700">
                            {snapshot.thisWeek.tasks.slice(0, 3).map((task, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400" />
                                <span className="truncate">{task}</span>
                              </li>
                            ))}
                            {snapshot.thisWeek.tasks.length > 3 && (
                              <li className="text-gray-400">
                                +{snapshot.thisWeek.tasks.length - 3}개 더...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-mono overflow-x-auto max-h-40">
                      {tempSnapshotToPlainText(snapshot)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {snapshots.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-sm">
            스냅샷이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

