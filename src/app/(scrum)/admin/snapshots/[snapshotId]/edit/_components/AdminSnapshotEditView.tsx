"use client";

/**
 * 관리자용 스냅샷 편집 뷰
 * 
 * - 기존 편집폼(3열) 재사용
 * - mode = 'admin' (snapshotId 기반 데이터 로딩)
 * - 저장 버튼: "업데이트하기"
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SnapshotCardList, SnapshotCardListRef } from "@/components/weekly-scrum/manage/SnapshotCardList";
import { SnapshotEditForm } from "@/components/weekly-scrum/manage/SnapshotEditForm";
import { PlainTextPreview } from "@/components/weekly-scrum/manage/PlainTextPreview";
import { ResizeHandle } from "@/components/weekly-scrum/manage/ResizeHandle";
import { ToastProvider, useToast } from "@/components/weekly-scrum/manage/Toast";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import type { TempSnapshot } from "@/components/weekly-scrum/manage/types";
import { tempSnapshotToV2Json, tempSnapshotToPlainText } from "@/components/weekly-scrum/manage/types";
import { updateAdminSnapshotAction } from "../../../_actions";
import type { Database, PastWeekTask, Collaborator } from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

interface AdminSnapshot {
  id: string;
  year: number;
  week: string;
  week_start_date: string;
  week_end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  title: string | null;
  entries: SnapshotEntryRow[];
  authorName?: string;
}

interface AdminSnapshotEditViewProps {
  snapshot: AdminSnapshot;
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

function convertEntryToTempSnapshot(entry: SnapshotEntryRow): TempSnapshot {
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

function AdminSnapshotEditViewInner({ snapshot }: AdminSnapshotEditViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // 엔트리들을 TempSnapshot으로 변환
  const [tempSnapshots, setTempSnapshots] = useState<TempSnapshot[]>(() =>
    snapshot.entries.map(convertEntryToTempSnapshot)
  );
  const [selectedId, setSelectedId] = useState<string | null>(tempSnapshots[0]?.tempId || null);
  const [deletedEntryIds, setDeletedEntryIds] = useState<string[]>([]);

  // 패널 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [editPanelRatio, setEditPanelRatio] = useState(0.5);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedSnapshot = tempSnapshots.find((s) => s.tempId === selectedId) || null;

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

  // 카드 삭제
  const handleDeleteCard = useCallback((tempId: string) => {
    setTempSnapshots((prev) => {
      const target = prev.find((s) => s.tempId === tempId);
      if (target?.isOriginal) {
        setDeletedEntryIds((ids) => [...ids, tempId]);
      }

      const newSnapshots = prev.filter((s) => s.tempId !== tempId);
      if (selectedId === tempId) {
        setSelectedId(newSnapshots[0]?.tempId || null);
      }
      return newSnapshots;
    });
    showToast("엔트리 삭제됨 (저장 시 반영)", "info");
  }, [selectedId, showToast]);

  // 새 엔트리 추가
  const handleAddEmpty = useCallback(() => {
    const newTempSnapshot: TempSnapshot = {
      tempId: `new-${Date.now()}`,
      isOriginal: false,
      isDirty: true,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    setTempSnapshots((prev) => [...prev, newTempSnapshot]);
    setSelectedId(newTempSnapshot.tempId);
    showToast("새 엔트리 추가됨", "success");
  }, [showToast]);

  // 저장
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await updateAdminSnapshotAction({
        snapshotId: snapshot.id,
        entries: tempSnapshots,
        deletedEntryIds,
      });

      if (result.success) {
        showToast("스냅샷이 업데이트되었습니다.", "success");
        navigationProgress.start();
        router.push(`/admin/snapshots/${snapshot.id}`);
      } else {
        showToast(result.error || "저장 실패", "error");
      }
    } catch (err) {
      showToast("저장 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [snapshot.id, tempSnapshots, deletedEntryIds, showToast, router]);

  // JSON 복사
  const handleCopyJson = useCallback(() => {
    if (selectedSnapshot) {
      const json = tempSnapshotToV2Json(selectedSnapshot);
      navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      showToast("JSON 복사됨", "success");
    }
  }, [selectedSnapshot, showToast]);

  // 텍스트 복사
  const handleCopyPlainText = useCallback(() => {
    if (selectedSnapshot) {
      const text = tempSnapshotToPlainText(selectedSnapshot);
      navigator.clipboard.writeText(text);
      showToast("텍스트 복사됨", "success");
    }
  }, [selectedSnapshot, showToast]);

  // 개별 카드 JSON 복사
  const handleCopyJsonCard = useCallback((snapshot: TempSnapshot) => {
    const json = tempSnapshotToV2Json(snapshot);
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    showToast("JSON 복사됨", "success");
  }, [showToast]);

  // 개별 카드 텍스트 복사
  const handleCopyPlainTextCard = useCallback((snapshot: TempSnapshot) => {
    const text = tempSnapshotToPlainText(snapshot);
    navigator.clipboard.writeText(text);
    showToast("텍스트 복사됨", "success");
  }, [showToast]);

  // 전체 JSON 복사
  const handleCopyAllJson = useCallback(() => {
    const allJson = tempSnapshots.map(tempSnapshotToV2Json);
    navigator.clipboard.writeText(JSON.stringify(allJson, null, 2));
    showToast("전체 JSON 복사됨", "success");
  }, [tempSnapshots, showToast]);

  // 전체 텍스트 복사
  const handleCopyAllPlainText = useCallback(() => {
    const allText = tempSnapshots.map(tempSnapshotToPlainText).join("\n\n---\n\n");
    navigator.clipboard.writeText(allText);
    showToast("전체 텍스트 복사됨", "success");
  }, [tempSnapshots, showToast]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* 헤더 */}
      <div className="h-14 px-4 border-b border-gray-100 bg-white/90 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/snapshots/${snapshot.id}`}
            onClick={() => navigationProgress.start()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">상세로</span>
          </Link>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {snapshot.year}년 {snapshot.week} 스냅샷 편집
            </h1>
            <p className="text-xs text-gray-500">
              {snapshot.week_start_date} ~ {snapshot.week_end_date}
              {snapshot.authorName && ` · ${snapshot.authorName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            JSON 복사
          </button>
          <button
            onClick={handleCopyPlainText}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            텍스트 복사
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            업데이트하기
          </button>
        </div>
      </div>

      {/* 3열 레이아웃 */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* 좌측: 카드 목록 */}
        <div
          className="shrink-0 bg-white border-r border-gray-100 overflow-hidden flex flex-col"
          style={{ width: leftPanelWidth }}
        >
          <SnapshotCardList
            ref={cardListRef}
            snapshots={tempSnapshots}
            selectedId={selectedId}
            onSelectCard={setSelectedId}
            onDeleteCard={handleDeleteCard}
            onDuplicateCard={() => {}}
            onCopyJson={handleCopyJsonCard}
            onCopyPlainText={handleCopyPlainTextCard}
            onAddEmpty={handleAddEmpty}
            onCopyAllJson={handleCopyAllJson}
            onCopyAllPlainText={handleCopyAllPlainText}
          />
        </div>

        {/* 좌측 리사이즈 핸들 */}
        <ResizeHandle
          onResize={(delta) => {
            setLeftPanelWidth((prev) =>
              Math.max(MIN_LEFT_PANEL_WIDTH, Math.min(MAX_LEFT_PANEL_WIDTH, prev + delta))
            );
          }}
        />

        {/* 중앙 + 우측 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 중앙: 편집 폼 */}
          <div
            className="bg-white border-r border-gray-100 overflow-hidden"
            style={{ width: `${editPanelRatio * 100}%` }}
          >
            {selectedSnapshot ? (
              <SnapshotEditForm
                key={selectedSnapshot.tempId}
                snapshot={selectedSnapshot}
                onUpdate={(updates) => handleUpdateCard(selectedSnapshot.tempId, updates)}
                onFocusSection={setFocusedSection}
                compact
                singleColumn
                hideName
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                엔트리를 선택하세요
              </div>
            )}
          </div>

          {/* 중앙 리사이즈 핸들 */}
          <ResizeHandle
            onResize={(delta) => {
              const containerWidth = window.innerWidth - leftPanelWidth - 8;
              const deltaRatio = delta / containerWidth;
              setEditPanelRatio((prev) => Math.max(0.25, Math.min(0.75, prev + deltaRatio)));
            }}
          />

          {/* 우측: 미리보기 */}
          <div className="flex-1 bg-gray-50 overflow-hidden">
            {selectedSnapshot ? (
              <PlainTextPreview
                snapshot={selectedSnapshot}
                focusedSection={focusedSection as "meta" | "pastWeek" | "thisWeek" | null}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                미리보기
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSnapshotEditView(props: AdminSnapshotEditViewProps) {
  return (
    <ToastProvider>
      <AdminSnapshotEditViewInner {...props} />
    </ToastProvider>
  );
}

