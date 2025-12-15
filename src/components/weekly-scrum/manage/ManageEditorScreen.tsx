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
  onDuplicateCard: (tempId: string) => void;
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
  onDuplicateCard,
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
  
  // 포커스된 섹션 (미리보기 연동)
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  
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
          {/* 미리보기 표시 체크박스 */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isThreeColumnMode}
                onChange={(e) => setForceThreeColumn(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`
                w-9 h-5 rounded-full transition-colors
                ${isThreeColumnMode ? "bg-gray-900" : "bg-gray-200 group-hover:bg-gray-300"}
              `} />
              <div className={`
                absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${isThreeColumnMode ? "translate-x-4" : "translate-x-0"}
              `} />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">
              미리보기
            </span>
          </label>
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
            onDuplicateCard={onDuplicateCard}
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
                  onFocusSection={setFocusedSection}
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
                focusedSection={focusedSection as import("./PlainTextPreview").PreviewSection | null}
              />
            </div>
          </>
        ) : (
          // 2열 모드: 편집 + 미리보기 꺼짐 플레이스홀더 (리사이즈 가능)
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
            {/* 미리보기 꺼짐 플레이스홀더 */}
            <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">미리보기 꺼짐</p>
                <p className="text-xs text-gray-300">
                  우측 상단 토글을 켜면<br/>실시간 미리보기를 확인할 수 있습니다
                </p>
              </div>
            </div>
          </>
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
