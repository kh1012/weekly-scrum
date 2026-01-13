"use client";

/**
 * 새 엔트리 작성 모달
 * 
 * 하나의 엔트리만 작성할 수 있는 모달 컴포넌트
 * 편집 영역과 Preview 영역을 포함
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SnapshotEditForm, type FormSection } from "./SnapshotEditForm";
import { PlainTextPreview, type PreviewSection } from "./PlainTextPreview";
import { ResizeHandle } from "./ResizeHandle";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "./Toast";
import type { TempSnapshot } from "./types";
import { createEmptySnapshot } from "./types";
import {
  validateSnapshot,
  formatMissingFieldsMessage,
} from "./snapshotValidation";
import { createSnapshotAndEntries, updateSnapshotAndEntries } from "@/app/(scrum)/manage/snapshots/_actions";
import type { SnapshotEntryPayload, CreateSnapshotPayload, UpdateSnapshotPayload } from "@/app/(scrum)/manage/snapshots/_actions";
import type { WorkloadLevel } from "@/lib/supabase/types";

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  week: number;
  workspaceId: string;
  userId: string;
  displayName: string;
  memberNames?: string[];
  domainOptions?: string[];
  projectOptions?: string[];
  moduleOptions?: string[];
  featureOptions?: string[];
  existingSnapshotId?: string; // 기존 스냅샷에 추가하는 경우
  onSuccess?: () => void;
}

const MIN_EDIT_PANEL_WIDTH = 300;
const MAX_EDIT_PANEL_WIDTH = 600;
const DEFAULT_EDIT_PANEL_WIDTH = 400;

export function NewEntryModal({
  isOpen,
  onClose,
  year,
  week,
  workspaceId,
  userId,
  displayName,
  memberNames,
  domainOptions,
  projectOptions,
  moduleOptions,
  featureOptions,
  existingSnapshotId,
  onSuccess,
}: NewEntryModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [editPanelWidth, setEditPanelWidth] = useState(DEFAULT_EDIT_PANEL_WIDTH);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedSection, setFocusedSection] = useState<FormSection | null>(null);
  const [forceThreeColumn, setForceThreeColumn] = useState(true);

  // 빈 엔트리 생성
  const [entry, setEntry] = useState<TempSnapshot>(() => 
    createEmptySnapshot(displayName)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // 모달이 열릴 때마다 새 엔트리로 초기화
  useEffect(() => {
    if (isOpen) {
      setEntry(createEmptySnapshot(displayName));
      setFocusedSection(null);
      setForceThreeColumn(true);
    }
  }, [isOpen, displayName]);

  // 엔트리 업데이트
  const handleUpdate = useCallback((updates: Partial<TempSnapshot>) => {
    setEntry((prev) => ({
      ...prev,
      ...updates,
      isDirty: true,
      updatedAt: new Date(),
    }));
  }, []);

  // 리사이즈 핸들러
  const handleEditResize = useCallback((delta: number) => {
    setEditPanelWidth((prev) =>
      Math.max(
        MIN_EDIT_PANEL_WIDTH,
        Math.min(MAX_EDIT_PANEL_WIDTH, prev + delta)
      )
    );
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    // 필수 필드 검증
    const validation = validateSnapshot(entry);
    if (!validation.isValid) {
      showToast(formatMissingFieldsMessage(validation.missingFields), "error");
      return;
    }

    setIsSaving(true);

    try {
      const entryPayload: SnapshotEntryPayload = {
        name: entry.name || displayName,
        domain: entry.domain,
        project: entry.project,
        module: entry.module || null,
        feature: entry.feature || null,
        past_week_tasks: entry.pastWeek.tasks,
        this_week_tasks: entry.thisWeek.tasks,
        risk: entry.pastWeek.risk,
        risk_level: entry.pastWeek.riskLevel,
        collaborators: entry.pastWeek.collaborators.map((c) => ({
          name: c.name,
          relations: c.relations,
        })),
      };

      if (existingSnapshotId) {
        // 기존 스냅샷에 엔트리 추가
        const payload: UpdateSnapshotPayload = {
          entries: [entryPayload],
          deletedEntryIds: [],
        };

        const result = await updateSnapshotAndEntries(existingSnapshotId, payload);

        if (result.success) {
          showToast("엔트리가 추가되었습니다.", "success");
          onSuccess?.();
          onClose();
        } else {
          showToast(result.error || "저장 실패", "error");
        }
      } else {
        // 새 스냅샷 생성
        const payload: CreateSnapshotPayload = {
          entries: [entryPayload],
          workloadLevel: null,
          workloadNote: null,
        };

        const result = await createSnapshotAndEntries(year, week, payload);

        if (result.success) {
          showToast("새 엔트리가 생성되었습니다.", "success");
          onSuccess?.();
          onClose();
        } else {
          showToast(result.error || "저장 실패", "error");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("저장 중 오류가 발생했습니다", "error");
    } finally {
      setIsSaving(false);
    }
  }, [entry, displayName, existingSnapshotId, year, week, showToast, onSuccess, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-7xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-6 py-4 border-b border-[#d0d7de] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#24292f]">
            새 엔트리 작성하기
          </h2>
          <div className="flex items-center gap-3">
            <LoadingButton
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
              loadingText="저장 중..."
              variant="primary"
              size="sm"
            >
              저장
            </LoadingButton>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#57606a] hover:bg-[#f6f8fa] transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 편집 영역 */}
          <div
            className="bg-white overflow-y-auto min-w-0 shrink-0 bg-gradient-to-b from-gray-50 to-white"
            style={{ width: editPanelWidth }}
          >
            <SnapshotEditForm
              snapshot={entry}
              onUpdate={handleUpdate}
              onFocusSection={(section) => setFocusedSection(section)}
              activeSection={focusedSection}
              compact
              singleColumn
              hideName
              nameOptions={memberNames && memberNames.length > 0 ? memberNames : undefined}
              domainOptions={domainOptions && domainOptions.length > 0 ? domainOptions : undefined}
              projectOptions={projectOptions && projectOptions.length > 0 ? projectOptions : undefined}
              moduleOptions={moduleOptions && moduleOptions.length > 0 ? moduleOptions : undefined}
              featureOptions={featureOptions && featureOptions.length > 0 ? featureOptions : undefined}
              forceThreeColumn={forceThreeColumn}
              onToggleThreeColumn={setForceThreeColumn}
            />
          </div>

          {/* 리사이즈 핸들 */}
          {forceThreeColumn && <ResizeHandle onResize={handleEditResize} />}

          {/* Preview 영역 */}
          {forceThreeColumn && (
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <PlainTextPreview
                snapshot={entry}
                focusedSection={focusedSection as PreviewSection | null}
                onSectionClick={(section) => setFocusedSection(section as FormSection)}
                displayName={displayName}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

