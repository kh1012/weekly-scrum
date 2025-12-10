"use client";

/**
 * 스냅샷 관리 편집 화면 - Airbnb 스타일
 *
 * 레이아웃:
 * - 좌측: 스냅샷 카드 리스트 (리사이즈 가능)
 * - 우측: 편집 패널 + Plain Text Preview (3열/탭 토글)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { SnapshotCardList, SnapshotCardListRef } from "./SnapshotCardList";
import { SnapshotEditForm } from "./SnapshotEditForm";
import { PlainTextPreview } from "./PlainTextPreview";
import { ResizeHandle } from "./ResizeHandle";
import { useToast } from "./Toast";
import type { TempSnapshot } from "./types";
import { tempSnapshotToV2Json, tempSnapshotToPlainText } from "./types";

interface ManageEditorScreenProps {
  snapshots: TempSnapshot[];
  selectedSnapshot: TempSnapshot | null;
  isSidebarOpen: boolean;
  onSelectCard: (tempId: string) => void;
  onDeleteCard: (tempId: string) => void;
  onUpdateCard: (tempId: string, updates: Partial<TempSnapshot>) => void;
  onAddEmpty: () => void;
  onBackToEntry: () => void;
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

// 3열 모드 최소 너비 (노트북 14인치 SNB 닫힌 상태 기준)
const THREE_COLUMN_MIN_WIDTH = 1200;
// 2열 편집폼 너비 (Full HD 이상)
const WIDE_FORM_MIN_WIDTH = 1800;

export function ManageEditorScreen({
  snapshots,
  selectedSnapshot,
  isSidebarOpen,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onAddEmpty,
  onBackToEntry,
}: ManageEditorScreenProps) {
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 좌측 패널 너비 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  
  // 편집 패널 너비 비율 (3열 모드에서 편집:미리보기 비율)
  const [editPanelRatio, setEditPanelRatio] = useState(0.5); // 0.3 ~ 0.7
  
  // 화면 너비 상태
  const [canShowThreeColumns, setCanShowThreeColumns] = useState(false);
  const [useWideFormLayout, setUseWideFormLayout] = useState(false);
  
  // 3열 모드 강제 토글 (기본: 3열)
  const [forceThreeColumn, setForceThreeColumn] = useState(true);

  // 화면 크기 감지
  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      // SNB가 닫혀있고 화면이 충분히 넓으면 3열 모드
      setCanShowThreeColumns(!isSidebarOpen && width >= THREE_COLUMN_MIN_WIDTH);
      // 충분히 넓은 화면에서만 2열 폼 레이아웃 사용
      setUseWideFormLayout(width >= WIDE_FORM_MIN_WIDTH);
    };
    
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [isSidebarOpen]);

  // 좌측 패널 리사이즈 핸들러
  const handleLeftResize = useCallback((delta: number) => {
    setLeftPanelWidth((prev) => {
      const next = prev + delta;
      return Math.max(MIN_LEFT_PANEL_WIDTH, Math.min(MAX_LEFT_PANEL_WIDTH, next));
    });
  }, []);

  // 편집/미리보기 비율 리사이즈 핸들러
  const handleEditPreviewResize = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth - leftPanelWidth - 10; // 핸들 너비 제외
    const deltaRatio = delta / containerWidth;
    setEditPanelRatio((prev) => {
      const next = prev + deltaRatio;
      return Math.max(0.25, Math.min(0.75, next)); // 25% ~ 75%
    });
  }, [leftPanelWidth]);

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

  // 현재 스냅샷 Plain Text 복사 (Preview에서 사용)
  const handleCopyCurrentPlainText = async () => {
    if (selectedSnapshot) {
      await handleCopyCardPlainText(selectedSnapshot);
    }
  };


  // 3열 모드 여부 (자동 감지 또는 강제)
  const isThreeColumnMode = forceThreeColumn || canShowThreeColumns;

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-[calc(100vh-7rem)] border border-gray-200 rounded-3xl overflow-hidden shadow-sm"
    >
      {/* 상단 툴바 - 고정 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToEntry}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-xs font-medium">처음으로</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-gray-700">
              {snapshots.length}개 스냅샷
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 2열 | 3열 토글 버튼 */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setForceThreeColumn(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isThreeColumnMode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              2열
            </button>
            <button
              onClick={() => setForceThreeColumn(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isThreeColumnMode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              3열
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 동일 높이, 개별 스크롤 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: 카드 리스트 (리사이즈 가능) */}
        <div
          className="border-r border-gray-100 bg-gradient-to-b from-gray-50 to-white flex flex-col shrink-0"
          style={{ width: leftPanelWidth }}
        >
          <SnapshotCardList
            ref={cardListRef}
            snapshots={snapshots}
            selectedId={selectedSnapshot?.tempId || null}
            onSelectCard={onSelectCard}
            onDeleteCard={onDeleteCard}
            onCopyJson={handleCopyCardJson}
            onCopyPlainText={handleCopyCardPlainText}
            onAddEmpty={onAddEmpty}
            onCopyAllJson={handleCopyAllJson}
            onCopyAllPlainText={handleCopyAllPlainText}
          />
        </div>

        {/* 리사이즈 핸들 */}
        <ResizeHandle onResize={handleLeftResize} />

        {/* 우측: 편집 + Preview */}
        {isThreeColumnMode ? (
          // 3열 모드: 편집 패널 | Preview 패널 (리사이즈 가능)
          <>
            <div 
              className="bg-white overflow-y-auto min-w-0 shrink-0"
              style={{ width: `calc((100% - ${leftPanelWidth}px - 12px) * ${editPanelRatio})` }}
            >
              {selectedSnapshot ? (
                <SnapshotEditForm
                  key={selectedSnapshot.tempId}
                  snapshot={selectedSnapshot}
                  onUpdate={(updates) =>
                    onUpdateCard(selectedSnapshot.tempId, updates)
                  }
                  compact
                  singleColumn
                />
              ) : (
                <EmptyState />
              )}
            </div>
            <ResizeHandle onResize={handleEditPreviewResize} />
            <div 
              className="overflow-hidden min-w-0 flex-1"
            >
              <PlainTextPreview
                snapshot={selectedSnapshot}
                onCopy={handleCopyCurrentPlainText}
              />
            </div>
          </>
        ) : (
          // 2열 모드: 편집만 표시
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="h-full bg-white overflow-y-auto">
              {selectedSnapshot ? (
                <SnapshotEditForm
                  key={selectedSnapshot.tempId}
                  snapshot={selectedSnapshot}
                  onUpdate={(updates) =>
                    onUpdateCard(selectedSnapshot.tempId, updates)
                  }
                  compact
                  singleColumn
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-300"
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
  );
}
