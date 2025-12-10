"use client";

/**
 * 스냅샷 관리 편집 화면
 *
 * 2단 레이아웃:
 * - 좌측: 스냅샷 카드 리스트
 * - 우측: 선택된 카드의 상세 편집 폼
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { SnapshotCardList, SnapshotCardListRef } from "./SnapshotCardList";
import { SnapshotEditForm } from "./SnapshotEditForm";
import { useToast } from "./Toast";
import type { TempSnapshot } from "./types";
import { tempSnapshotToV2Json, tempSnapshotToPlainText } from "./types";

interface ManageEditorScreenProps {
  snapshots: TempSnapshot[];
  selectedSnapshot: TempSnapshot | null;
  viewMode: "styled" | "plaintext";
  onSelectCard: (tempId: string) => void;
  onDeleteCard: (tempId: string) => void;
  onUpdateCard: (tempId: string, updates: Partial<TempSnapshot>) => void;
  onAddEmpty: () => void;
  onToggleViewMode: () => void;
  onBackToEntry: () => void;
}

export function ManageEditorScreen({
  snapshots,
  selectedSnapshot,
  viewMode,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onAddEmpty,
  onToggleViewMode,
  onBackToEntry,
}: ManageEditorScreenProps) {
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // 전체 JSON 복사
  const handleCopyAllJson = async () => {
    try {
      const jsonData = snapshots.map(tempSnapshotToV2Json);
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      showToast(`${snapshots.length}개 스냅샷 JSON 복사 완료`, "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  // 전체 Plain Text 복사
  const handleCopyAllPlainText = async () => {
    try {
      const plainTexts = snapshots.map(tempSnapshotToPlainText);
      await navigator.clipboard.writeText(plainTexts.join("\n\n---\n\n"));
      showToast(`${snapshots.length}개 스냅샷 Text 복사 완료`, "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  // 개별 JSON 복사
  const handleCopyCardJson = async (snapshot: TempSnapshot) => {
    try {
      const jsonData = tempSnapshotToV2Json(snapshot);
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      showToast("JSON 복사 완료", "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  // 개별 Plain Text 복사
  const handleCopyCardPlainText = async (snapshot: TempSnapshot) => {
    try {
      await navigator.clipboard.writeText(tempSnapshotToPlainText(snapshot));
      showToast("Plain Text 복사 완료", "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  // 보기 모드 전환 (선택된 카드 확장)
  const handleToggleViewModeWithExpand = () => {
    // 선택된 카드가 있으면 확장
    if (selectedSnapshot) {
      cardListRef.current?.expandCard(selectedSnapshot.tempId);
    }
    onToggleViewMode();
  };

  return (
    <div className="flex flex-col w-full border border-gray-200 rounded-2xl">
      {/* 상단 툴바 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToEntry}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm">처음으로</span>
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-sm text-gray-500">
            {snapshots.length}개 스냅샷
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 보기 모드 토글 */}
          <button
            onClick={handleToggleViewModeWithExpand}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {viewMode === "styled" ? "Plain Text 보기" : "Styled 보기"}
          </button>

          <div className="h-4 w-px bg-gray-300" />

          {/* 전체 복사 버튼들 */}
          <button
            onClick={handleCopyAllJson}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            전체 JSON
          </button>
          <button
            onClick={handleCopyAllPlainText}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            전체 Text
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex">
        {/* 좌측: 카드 리스트 */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col rounded-bl-2xl">
          <SnapshotCardList
            ref={cardListRef}
            snapshots={snapshots}
            selectedId={selectedSnapshot?.tempId || null}
            viewMode={viewMode}
            onSelectCard={onSelectCard}
            onDeleteCard={onDeleteCard}
            onCopyJson={handleCopyCardJson}
            onCopyPlainText={handleCopyCardPlainText}
            onAddEmpty={onAddEmpty}
          />
        </div>

        {/* 우측: 편집 폼 */}
        <div className="flex-1 bg-white overflow-y-auto overflow-x-hidden rounded-br-2xl">
          {selectedSnapshot ? (
            <SnapshotEditForm
              snapshot={selectedSnapshot}
              onUpdate={(updates) =>
                onUpdateCard(selectedSnapshot.tempId, updates)
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>스냅샷을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
