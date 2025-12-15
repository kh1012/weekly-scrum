"use client";

/**
 * 주차별 편집하기 화면
 * 
 * - 기존 편집 UI(3열 구성) 재사용
 * - 스냅샷 선택 드롭다운
 * - "업데이트하기" 버튼으로 저장
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
import { tempSnapshotToV2Json, tempSnapshotToPlainText } from "@/components/weekly-scrum/manage/types";
import { updateSnapshotAndEntries } from "../../../../_actions";
import type { SnapshotEntryPayload } from "../../../../_actions";
import type { Database, PastWeekTask, Collaborator } from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

interface SnapshotWithEntries {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  entries: SnapshotEntryRow[];
}

interface EditSnapshotsViewProps {
  year: number;
  week: number;
  snapshots: SnapshotWithEntries[];
  userId: string;
  workspaceId: string;
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

function convertEntryToTempSnapshot(entry: SnapshotEntryRow, index: number): TempSnapshot {
  return {
    tempId: entry.id,
    isOriginal: true,
    isDirty: false,
    createdAt: new Date(entry.created_at),
    updatedAt: new Date(entry.updated_at),
    name: entry.name,
    domain: entry.domain,
    project: entry.project,
    module: entry.module || "",
    feature: entry.feature || "",
    pastWeek: {
      tasks: (entry.past_week_tasks as PastWeekTask[]) || [],
      risk: entry.risk,
      riskLevel: entry.risk_level as 0 | 1 | 2 | 3 | null,
      collaborators: (entry.collaborators as Collaborator[]) || [],
    },
    thisWeek: {
      tasks: entry.this_week_tasks || [],
    },
  };
}

function EditSnapshotsViewInner({
  year,
  week,
  snapshots,
}: EditSnapshotsViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // 현재 선택된 스냅샷
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(snapshots[0]?.id);
  const selectedSnapshotData = snapshots.find((s) => s.id === selectedSnapshotId);

  // 엔트리들을 TempSnapshot으로 변환
  const [tempSnapshots, setTempSnapshots] = useState<TempSnapshot[]>(() => 
    (selectedSnapshotData?.entries || []).map(convertEntryToTempSnapshot)
  );
  const [selectedId, setSelectedId] = useState<string | null>(tempSnapshots[0]?.tempId || null);
  const [deletedEntryIds, setDeletedEntryIds] = useState<string[]>([]);

  // 패널 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [editPanelRatio, setEditPanelRatio] = useState(0.5);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [forceThreeColumn, setForceThreeColumn] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const weekRange = formatWeekRange(year, week);
  const selectedSnapshot = tempSnapshots.find((s) => s.tempId === selectedId) || null;

  // 스냅샷 변경 시 엔트리 갱신
  const handleSnapshotChange = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    const snapshotData = snapshots.find((s) => s.id === snapshotId);
    const newTempSnapshots = (snapshotData?.entries || []).map(convertEntryToTempSnapshot);
    setTempSnapshots(newTempSnapshots);
    setSelectedId(newTempSnapshots[0]?.tempId || null);
    setDeletedEntryIds([]);
  };

  // 카드 선택
  const handleSelectCard = useCallback((tempId: string) => {
    setSelectedId(tempId);
  }, []);

  // 카드 삭제
  const handleDeleteCard = useCallback((tempId: string) => {
    setDeletedEntryIds((prev) => [...prev, tempId]);
    setTempSnapshots((prev) => {
      const newSnapshots = prev.filter((s) => s.tempId !== tempId);
      if (selectedId === tempId) {
        setSelectedId(newSnapshots[0]?.tempId || null);
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
    const now = new Date();
    const newSnapshot: TempSnapshot = {
      tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isOriginal: false,
      isDirty: true,
      createdAt: now,
      updatedAt: now,
      name: "",
      domain: "",
      project: "",
      module: "",
      feature: "",
      pastWeek: {
        tasks: [],
        risk: null,
        riskLevel: null,
        collaborators: [],
      },
      thisWeek: {
        tasks: [],
      },
    };
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

  // 업데이트하기 (저장)
  const handleSave = async () => {
    if (!selectedSnapshotId) return;

    setIsSaving(true);
    try {
      const entries: SnapshotEntryPayload[] = tempSnapshots.map((s) => ({
        id: s.isOriginal ? s.tempId : undefined,
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

      const result = await updateSnapshotAndEntries(selectedSnapshotId, {
        entries,
        deletedEntryIds,
      });

      if (result.success) {
        showToast("업데이트 완료!", "success");
        router.refresh();
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

  return (
    <div className="flex flex-col w-full h-[calc(100vh-7rem)] border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* 상단 툴바 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/manage/snapshots")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-medium">목록으로</span>
          </button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {year}년 W{week.toString().padStart(2, "0")}
            </span>
            <span className="text-sm text-gray-500">({weekRange})</span>
          </div>

          {/* 스냅샷 선택 드롭다운 */}
          {snapshots.length > 1 && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <select
                value={selectedSnapshotId}
                onChange={(e) => handleSnapshotChange(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                {snapshots.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {s.title || `스냅샷 ${i + 1}`}
                  </option>
                ))}
              </select>
            </>
          )}

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

          {/* 업데이트하기 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                업데이트하기
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

export function EditSnapshotsView(props: EditSnapshotsViewProps) {
  return (
    <ToastProvider>
      <EditSnapshotsViewInner {...props} />
    </ToastProvider>
  );
}

