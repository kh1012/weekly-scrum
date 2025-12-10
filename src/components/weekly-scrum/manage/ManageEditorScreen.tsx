"use client";

/**
 * 스냅샷 관리 편집 화면 - Airbnb 스타일
 *
 * 2단 레이아웃:
 * - 좌측: 스냅샷 카드 리스트
 * - 우측: 선택된 카드의 상세 편집 폼
 */

import { useRef } from "react";
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
      // 스냅샷 구분: 빈 줄 1개
      await navigator.clipboard.writeText(plainTexts.join("\n\n"));
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
    if (selectedSnapshot) {
      cardListRef.current?.expandCard(selectedSnapshot.tempId);
    }
    onToggleViewMode();
  };

  return (
    <div className="flex flex-col w-full border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* 상단 툴바 - Airbnb 스타일 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <button
            onClick={onBackToEntry}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm font-medium">처음으로</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-gray-700">
              {snapshots.length}개 스냅샷
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 전체 복사 버튼들 */}
          <button
            onClick={handleCopyAllJson}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            JSON
          </button>
          <button
            onClick={handleCopyAllPlainText}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg
              className="w-4 h-4"
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
            Text
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: 카드 리스트 */}
        <div className="w-80 border-r border-gray-100 bg-gradient-to-b from-gray-50 to-white flex flex-col">
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
            onToggleViewMode={handleToggleViewModeWithExpand}
          />
        </div>

        {/* 우측: 편집 폼 */}
        <div className="flex-1 bg-white overflow-y-auto overflow-x-hidden">
          {selectedSnapshot ? (
            <SnapshotEditForm
              key={selectedSnapshot.tempId}
              snapshot={selectedSnapshot}
              onUpdate={(updates) =>
                onUpdateCard(selectedSnapshot.tempId, updates)
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">스냅샷을 선택하세요</p>
                <p className="text-gray-300 text-xs mt-1">
                  또는 좌측에서 새 카드를 추가하세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
