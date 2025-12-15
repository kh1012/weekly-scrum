"use client";

/**
 * 새로 작성하기 화면
 * 
 * 시작 옵션:
 * 1. 데이터 불러오기 (JSON 붙여넣기)
 * 2. 새로 작성하기 (빈 상태에서 시작)
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatWeekRange } from "@/lib/date/isoWeek";
import { SnapshotCardList, SnapshotCardListRef } from "@/components/weekly-scrum/manage/SnapshotCardList";
import { SnapshotEditForm } from "@/components/weekly-scrum/manage/SnapshotEditForm";
import { PlainTextPreview } from "@/components/weekly-scrum/manage/PlainTextPreview";
import { ResizeHandle } from "@/components/weekly-scrum/manage/ResizeHandle";
import { ToastProvider, useToast } from "@/components/weekly-scrum/manage/Toast";
import type { TempSnapshot } from "@/components/weekly-scrum/manage/types";
import { createEmptySnapshot, tempSnapshotToV2Json, tempSnapshotToPlainText, convertToTempSnapshot } from "@/components/weekly-scrum/manage/types";
import { createSnapshotAndEntries } from "../../../../_actions";
import type { SnapshotEntryPayload } from "../../../../_actions";

interface NewSnapshotViewProps {
  year: number;
  week: number;
  userId: string;
  workspaceId: string;
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

function NewSnapshotViewInner({
  year,
  week,
}: NewSnapshotViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // 화면 모드: entry (진입점) / editor (편집)
  const [mode, setMode] = useState<"entry" | "editor">("entry");
  
  // 엔트리들
  const [tempSnapshots, setTempSnapshots] = useState<TempSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 패널 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [editPanelRatio, setEditPanelRatio] = useState(0.5);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [forceThreeColumn, setForceThreeColumn] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // JSON 붙여넣기 상태
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const weekRange = formatWeekRange(year, week);
  const selectedSnapshot = tempSnapshots.find((s) => s.tempId === selectedId) || null;

  // 새로 작성하기 (빈 상태로 시작)
  const handleStartEmpty = () => {
    const newSnapshot = createEmptySnapshot();
    setTempSnapshots([newSnapshot]);
    setSelectedId(newSnapshot.tempId);
    setMode("editor");
  };

  // JSON 불러오기
  const handleImportJson = () => {
    setParseError(null);
    
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      
      if (items.length === 0) {
        setParseError("데이터가 비어있습니다.");
        return;
      }

      const snapshots = items.map((item, index) => {
        // 기본 필수 필드 검증
        if (!item.name && !item.domain && !item.project) {
          throw new Error(`항목 ${index + 1}: name, domain, project 중 하나는 필수입니다.`);
        }
        return convertToTempSnapshot(item);
      });

      setTempSnapshots(snapshots);
      setSelectedId(snapshots[0].tempId);
      setMode("editor");
      showToast(`${snapshots.length}개 항목을 불러왔습니다.`, "success");
    } catch (error) {
      if (error instanceof SyntaxError) {
        setParseError("JSON 형식이 올바르지 않습니다.");
      } else if (error instanceof Error) {
        setParseError(error.message);
      } else {
        setParseError("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  // 카드 선택
  const handleSelectCard = useCallback((tempId: string) => {
    setSelectedId(tempId);
  }, []);

  // 카드 삭제
  const handleDeleteCard = useCallback((tempId: string) => {
    setTempSnapshots((prev) => {
      const newSnapshots = prev.filter((s) => s.tempId !== tempId);
      if (selectedId === tempId) {
        setSelectedId(newSnapshots[0]?.tempId || null);
      }
      if (newSnapshots.length === 0) {
        setMode("entry");
      }
      return newSnapshots;
    });
  }, [selectedId]);

  // 카드 복제
  const handleDuplicateCard = useCallback((tempId: string) => {
    setTempSnapshots((prev) => {
      const target = prev.find((s) => s.tempId === tempId);
      if (!target) return prev;

      const now = new Date();
      const duplicated: TempSnapshot = {
        ...target,
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isOriginal: false,
        isDirty: true,
        createdAt: now,
        updatedAt: now,
        pastWeek: {
          ...target.pastWeek,
          tasks: target.pastWeek.tasks.map((t) => ({ ...t })),
          risk: target.pastWeek.risk ? [...target.pastWeek.risk] : null,
          collaborators: target.pastWeek.collaborators.map((c) => ({
            ...c,
            relations: c.relations ? [...c.relations] : undefined,
          })),
        },
        thisWeek: {
          tasks: [...target.thisWeek.tasks],
        },
      };

      const targetIndex = prev.findIndex((s) => s.tempId === tempId);
      const newSnapshots = [...prev];
      newSnapshots.splice(targetIndex + 1, 0, duplicated);
      setSelectedId(duplicated.tempId);
      return newSnapshots;
    });
  }, []);

  // 카드 업데이트
  const handleUpdateCard = useCallback((tempId: string, updates: Partial<TempSnapshot>) => {
    setTempSnapshots((prev) =>
      prev.map((s) =>
        s.tempId === tempId
          ? { ...s, ...updates, isDirty: true, updatedAt: new Date() }
          : s
      )
    );
  }, []);

  // 빈 카드 추가
  const handleAddEmpty = useCallback(() => {
    const newSnapshot = createEmptySnapshot();
    setTempSnapshots((prev) => [...prev, newSnapshot]);
    setSelectedId(newSnapshot.tempId);
  }, []);

  // 리사이즈 핸들러
  const handleLeftResize = useCallback((delta: number) => {
    setLeftPanelWidth((prev) =>
      Math.max(MIN_LEFT_PANEL_WIDTH, Math.min(MAX_LEFT_PANEL_WIDTH, prev + delta))
    );
  }, []);

  const handleEditPreviewResize = useCallback((delta: number) => {
    const containerWidth = window.innerWidth - leftPanelWidth - 10;
    const deltaRatio = delta / containerWidth;
    setEditPanelRatio((prev) => Math.max(0.25, Math.min(0.75, prev + deltaRatio)));
  }, [leftPanelWidth]);

  // 복사 핸들러들
  const handleCopyCardJson = async (snapshot: TempSnapshot) => {
    try {
      const jsonData = tempSnapshotToV2Json(snapshot);
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      showToast("JSON 복사 완료", "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  const handleCopyCardPlainText = async (snapshot: TempSnapshot) => {
    try {
      await navigator.clipboard.writeText(tempSnapshotToPlainText(snapshot));
      showToast("Plain Text 복사 완료", "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  const handleCopyAllJson = async () => {
    try {
      const jsonData = tempSnapshots.map(tempSnapshotToV2Json);
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      showToast(`${tempSnapshots.length}개 스냅샷 JSON 복사 완료`, "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  const handleCopyAllPlainText = async () => {
    try {
      const plainTexts = tempSnapshots.map(tempSnapshotToPlainText);
      await navigator.clipboard.writeText(plainTexts.join("\n\n"));
      showToast(`${tempSnapshots.length}개 스냅샷 Text 복사 완료`, "success");
    } catch {
      showToast("복사 실패", "error");
    }
  };

  const handleCopyCurrentPlainText = async () => {
    if (selectedSnapshot) {
      await handleCopyCardPlainText(selectedSnapshot);
    }
  };

  // 신규 등록하기 (저장)
  const handleSave = async () => {
    if (tempSnapshots.length === 0) {
      showToast("저장할 엔트리가 없습니다.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const entries: SnapshotEntryPayload[] = tempSnapshots.map((s) => ({
        name: s.name,
        domain: s.domain,
        project: s.project,
        module: s.module || null,
        feature: s.feature || null,
        past_week_tasks: s.pastWeek.tasks,
        this_week_tasks: s.thisWeek.tasks,
        risk: s.pastWeek.risk,
        risk_level: s.pastWeek.riskLevel,
        collaborators: s.pastWeek.collaborators.map((c) => ({
          name: c.name,
          relation: c.relation || "pair",
          relations: c.relations,
        })),
      }));

      const result = await createSnapshotAndEntries(year, week, { entries });

      if (result.success) {
        showToast("신규 등록 완료!", "success");
        router.push("/manage/snapshots");
      } else {
        showToast(result.error || "저장 실패", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("저장 중 오류가 발생했습니다", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 진입점 화면
  if (mode === "entry") {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="max-w-3xl w-full px-4">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <button
              onClick={() => router.push("/manage/snapshots")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              목록으로
            </button>
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              새로 작성하기
            </h1>
            <p className="text-lg text-gray-500">
              {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
            </p>
          </div>

          {/* 옵션 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 데이터 불러오기 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">데이터 불러오기</h2>
                  <p className="text-sm text-gray-500">JSON 붙여넣기</p>
                </div>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setParseError(null);
                }}
                placeholder="JSON 데이터를 붙여넣으세요..."
                className="w-full h-32 p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono"
              />

              {parseError && (
                <p className="mt-2 text-sm text-red-600">{parseError}</p>
              )}

              <button
                onClick={handleImportJson}
                disabled={!jsonInput.trim()}
                className="w-full mt-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                불러오기
              </button>
            </div>

            {/* 새로 작성하기 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">새로 작성하기</h2>
                  <p className="text-sm text-gray-500">빈 상태에서 시작</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                빈 스냅샷 엔트리를 생성하여 처음부터 작성합니다.
                편집 화면에서 필요한 정보를 입력할 수 있습니다.
              </p>

              <button
                onClick={handleStartEmpty}
                className="w-full py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                빈 상태로 시작
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 편집 화면
  return (
    <div className="flex flex-col w-full h-[calc(100vh-7rem)] border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* 상단 툴바 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("entry")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-medium">옵션으로</span>
          </button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {year}년 W{week.toString().padStart(2, "0")}
            </span>
            <span className="text-sm text-gray-500">({weekRange})</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
              신규
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-gray-700">
              {tempSnapshots.length}개 엔트리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 미리보기 토글 */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={forceThreeColumn}
                onChange={(e) => setForceThreeColumn(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${forceThreeColumn ? "bg-gray-900" : "bg-gray-200 group-hover:bg-gray-300"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${forceThreeColumn ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">미리보기</span>
          </label>

          <div className="h-6 w-px bg-gray-200" />

          {/* 신규 등록하기 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving || tempSnapshots.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                저장 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                신규 등록하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: 카드 리스트 */}
        <div
          className="border-r border-gray-100 bg-gradient-to-b from-gray-50 to-white flex flex-col shrink-0"
          style={{ width: leftPanelWidth }}
        >
          <SnapshotCardList
            ref={cardListRef}
            snapshots={tempSnapshots}
            selectedId={selectedId}
            onSelectCard={handleSelectCard}
            onDeleteCard={handleDeleteCard}
            onDuplicateCard={handleDuplicateCard}
            onCopyJson={handleCopyCardJson}
            onCopyPlainText={handleCopyCardPlainText}
            onAddEmpty={handleAddEmpty}
            onCopyAllJson={handleCopyAllJson}
            onCopyAllPlainText={handleCopyAllPlainText}
          />
        </div>

        <ResizeHandle onResize={handleLeftResize} />

        {/* 중앙: 편집 폼 */}
        <div
          className="bg-white overflow-y-auto min-w-0 shrink-0"
          style={{ width: forceThreeColumn ? `calc((100% - ${leftPanelWidth}px - 12px) * ${editPanelRatio})` : "100%" }}
        >
          {selectedSnapshot ? (
            <SnapshotEditForm
              key={selectedSnapshot.tempId}
              snapshot={selectedSnapshot}
              onUpdate={(updates) => handleUpdateCard(selectedSnapshot.tempId, updates)}
              onFocusSection={setFocusedSection}
              compact
              singleColumn
            />
          ) : (
            <EmptyState onAddEmpty={handleAddEmpty} />
          )}
        </div>

        {/* 우측: 미리보기 */}
        {forceThreeColumn && (
          <>
            <ResizeHandle onResize={handleEditPreviewResize} />
            <div className="overflow-hidden min-w-0 flex-1">
              <PlainTextPreview
                snapshot={selectedSnapshot}
                onCopy={handleCopyCurrentPlainText}
                focusedSection={focusedSection as import("@/components/weekly-scrum/manage/PlainTextPreview").PreviewSection | null}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAddEmpty }: { onAddEmpty: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm mb-4">엔트리가 없습니다</p>
        <button
          onClick={onAddEmpty}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          새 엔트리 추가
        </button>
      </div>
    </div>
  );
}

export function NewSnapshotView(props: NewSnapshotViewProps) {
  return (
    <ToastProvider>
      <NewSnapshotViewInner {...props} />
    </ToastProvider>
  );
}

