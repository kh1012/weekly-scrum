"use client";

/**
 * 스냅샷 목록 컴포넌트
 * - Pinterest 스타일 그리드 / 리스트 뷰 토글
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { TrashIcon } from "@/components/common/Icons";
import { deleteSnapshotEntryAction } from "@/app/actions/snapshots";
import { useToast } from "@/components/weekly-scrum/manage/Toast";
import type { SnapshotSummary } from "./SnapshotsMainView";
import type { WorkloadLevel } from "@/lib/supabase/types";
import { WORKLOAD_LEVEL_LABELS, WORKLOAD_LEVEL_COLORS } from "@/lib/supabase/types";

// Entry 타입 (개별 카드용)
interface SnapshotEntry {
  entryId: string;
  snapshotId: string;
  entryIndex: number;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  past_week?: { tasks?: { title: string; progress: number }[] };
  this_week?: { tasks?: string[] };
  risks?: string[];
  risk_level?: number;
  collaborators?: { name: string; relations?: string[] }[];
  /** 스냅샷 레벨의 workload (첫 엔트리에만 표시) */
  workload_level?: WorkloadLevel | null;
  isFirstEntry?: boolean;
}

interface SnapshotListProps {
  snapshots: SnapshotSummary[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  onRefresh: () => void;
  year: number;
  week: number;
  allExpanded?: boolean;
  onToggleExpanded?: () => void;
  onEntryDeleted?: () => void;
  isSelectMode?: boolean;
  onToggleSelectMode?: (enabled: boolean) => void;
}

export function SnapshotList({
  snapshots,
  isLoading,
  viewMode,
  year,
  week,
  allExpanded = false,
  onEntryDeleted,
  isSelectMode: externalSelectMode = false,
  onToggleSelectMode,
}: SnapshotListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  // 선택 모드 상태 (외부에서 제어 가능)
  const isSelectMode = externalSelectMode;
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 선택 모드 해제 시 선택 초기화
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedEntryIds(new Set());
    }
  }, [isSelectMode]);

  // 개별 카드 편집 핸들러
  const handleEditCard = (snapshotId: string, entryIndex?: number) => {
    navigationProgress.start();
    const url = `/manage/snapshots/${year}/${week}/edit?snapshotId=${snapshotId}${
      entryIndex !== undefined ? `&entryIndex=${entryIndex}` : ""
    }`;
    router.push(url);
  };

  // 선택 토글
  const toggleSelection = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedEntryIds.size === allEntries.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(allEntries.map((e) => e.entryId)));
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedEntryIds);
    let successCount = 0;
    let failCount = 0;

    for (const entryId of idsToDelete) {
      const result = await deleteSnapshotEntryAction(entryId);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDeleting(false);
    setShowBulkDeleteModal(false);
    setSelectedEntryIds(new Set());
    onToggleSelectMode?.(false);

    if (failCount === 0) {
      showToast(`${successCount}개 항목이 삭제되었습니다.`, "success");
    } else {
      showToast(
        `${successCount}개 성공, ${failCount}개 실패`,
        failCount > successCount ? "error" : "info"
      );
    }

    onEntryDeleted?.();
  };

  // 스냅샷의 entries를 펼쳐서 개별 카드로 표시
  const allEntries: SnapshotEntry[] = snapshots.flatMap((snapshot) =>
    snapshot.entries.map((entry, index) => ({
      entryId: entry.id,
      snapshotId: snapshot.id,
      entryIndex: index,
      domain: entry.domain,
      project: entry.project,
      module: entry.module,
      feature: entry.feature,
      past_week: entry.past_week,
      this_week: entry.this_week,
      risks: entry.risks,
      risk_level: entry.risk_level,
      collaborators: entry.collaborators?.map((c) => ({
        name: c.name,
        relations: c.relations,
      })),
      // 첫 엔트리에만 workload 표시
      workload_level: index === 0 ? snapshot.workload_level : undefined,
      isFirstEntry: index === 0,
    }))
  );

  // 로딩 중이고 데이터가 없으면 로딩 상태 표시
  if (isLoading && snapshots.length === 0) {
    return <LogoLoadingSpinner />;
  }

  // 로딩이 끝나고 데이터가 없으면 빈 상태 표시
  if (!isLoading && snapshots.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* 선택 모드 툴바 */}
      {isSelectMode && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {selectedEntryIds.size === allEntries.length
                ? "전체 해제"
                : "전체 선택"}
            </button>
            <span className="text-sm text-gray-600">
              {selectedEntryIds.size}개 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={selectedEntryIds.size === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              삭제 ({selectedEntryIds.size})
            </button>
            <button
              onClick={() => onToggleSelectMode?.(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 스냅샷 목록 */}
      {viewMode === "grid" ? (
        <GridView
          entries={allEntries}
          allExpanded={allExpanded}
          onEditCard={handleEditCard}
          onEntryDeleted={onEntryDeleted}
          isSelectMode={isSelectMode}
          selectedEntryIds={selectedEntryIds}
          onToggleSelection={toggleSelection}
        />
      ) : (
        <ListView 
          entries={allEntries} 
          onEditCard={handleEditCard}
          onEntryDeleted={onEntryDeleted}
          isSelectMode={isSelectMode}
          selectedEntryIds={selectedEntryIds}
          onToggleSelection={toggleSelection}
        />
      )}

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteModal && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => !isDeleting && setShowBulkDeleteModal(false)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              style={{
                background: "white",
                boxShadow:
                  "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <TrashIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      일괄 삭제 확인
                    </h3>
                    <p className="text-sm text-white/80">
                      {selectedEntryIds.size}개 항목을 삭제합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <p className="text-gray-700">
                  선택한 <span className="font-bold text-red-600">{selectedEntryIds.size}개</span>의 스냅샷 항목을 삭제하시겠습니까?
                  <br />
                  <br />
                  삭제된 항목은 복구할 수 없습니다.
                </p>
              </div>

              {/* 버튼 */}
              <div
                className="flex gap-3 px-6 pb-6"
                style={{ background: "#f9fafb" }}
              >
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  }}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}
    </div>
  );
}

// 그리드 뷰 (Pinterest 스타일)
function GridView({
  entries,
  allExpanded,
  onEditCard,
  onEntryDeleted,
  isSelectMode,
  selectedEntryIds,
  onToggleSelection,
}: {
  entries: SnapshotEntry[];
  allExpanded: boolean;
  onEditCard: (snapshotId: string, entryIndex?: number) => void;
  onEntryDeleted?: () => void;
  isSelectMode?: boolean;
  selectedEntryIds?: Set<string>;
  onToggleSelection?: (entryId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entries.map((entry) => (
        <EntryCard
          key={`${entry.snapshotId}-${entry.entryIndex}`}
          entry={entry}
          forceExpanded={allExpanded}
          onEdit={() => onEditCard(entry.snapshotId, entry.entryIndex)}
          onDelete={onEntryDeleted}
          isSelectMode={isSelectMode}
          isSelected={selectedEntryIds?.has(entry.entryId)}
          onToggleSelection={() => onToggleSelection?.(entry.entryId)}
        />
      ))}
    </div>
  );
}

// 리스트 뷰
function ListView({
  entries,
  onEditCard,
  onEntryDeleted,
  isSelectMode,
  selectedEntryIds,
  onToggleSelection,
}: {
  entries: SnapshotEntry[];
  onEditCard: (snapshotId: string, entryIndex?: number) => void;
  onEntryDeleted?: () => void;
  isSelectMode?: boolean;
  selectedEntryIds?: Set<string>;
  onToggleSelection?: (entryId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryRow
          key={`${entry.snapshotId}-${entry.entryIndex}`}
          entry={entry}
          onEdit={() => onEditCard(entry.snapshotId, entry.entryIndex)}
          onDelete={onEntryDeleted}
          isSelectMode={isSelectMode}
          isSelected={selectedEntryIds?.has(entry.entryId)}
          onToggleSelection={() => onToggleSelection?.(entry.entryId)}
        />
      ))}
    </div>
  );
}

// Workload 뱃지 컴포넌트
function WorkloadBadge({ level }: { level: WorkloadLevel }) {
  const colors = WORKLOAD_LEVEL_COLORS[level];
  const label = WORKLOAD_LEVEL_LABELS[level];
  
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {level === "light" && "🌿"}
      {level === "normal" && "⚡"}
      {level === "burden" && "🔥"}
      <span>{label}</span>
    </span>
  );
}

// Entry 카드 (그리드용) - 개별 엔트리 표시
function EntryCard({
  entry,
  forceExpanded = false,
  onEdit,
  onDelete,
  isSelectMode,
  isSelected,
  onToggleSelection,
}: {
  entry: SnapshotEntry;
  forceExpanded?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const { showToast } = useToast();
  const [localExpanded, setLocalExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // forceExpanded가 false로 변경되면 localExpanded도 리셋
  useEffect(() => {
    if (!forceExpanded) {
      setLocalExpanded(false);
    }
  }, [forceExpanded]);

  // 옵션 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node) &&
        optionsButtonRef.current &&
        !optionsButtonRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(false);
      }
    }

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOptionsMenu]);

  const isExpanded = forceExpanded || localExpanded;

  // 데이터 추출
  const pastWeekTasks = entry.past_week?.tasks || [];
  const thisWeekTasks = entry.this_week?.tasks || [];
  const risks = entry.risks || [];
  const riskLevel = entry.risk_level || 0;
  const collaborators = entry.collaborators || [];

  // 진행률 계산
  const avgProgress =
    pastWeekTasks.length > 0
      ? Math.round(
          pastWeekTasks.reduce((sum, t) => sum + t.progress, 0) /
            pastWeekTasks.length
        )
      : null;

  // 관계 색상 매핑
  const getRelationStyle = (relations?: string[]) => {
    const rel = relations?.[0];
    if (rel === "pair")
      return { bg: "bg-purple-100", text: "text-purple-700", label: "페어" };
    if (rel === "pre")
      return { bg: "bg-blue-100", text: "text-blue-700", label: "선행" };
    if (rel === "post")
      return { bg: "bg-emerald-100", text: "text-emerald-700", label: "후행" };
    return { bg: "bg-gray-100", text: "text-gray-600", label: "" };
  };

  // 리스크 레벨 색상
  const getRiskLevelStyle = (level: number) => {
    if (level >= 3)
      return { bg: "bg-red-100", text: "text-red-600", label: "높음" };
    if (level >= 2)
      return { bg: "bg-orange-100", text: "text-orange-600", label: "중간" };
    if (level >= 1)
      return { bg: "bg-yellow-100", text: "text-yellow-600", label: "낮음" };
    return { bg: "bg-gray-100", text: "text-gray-500", label: "없음" };
  };

  const riskStyle = getRiskLevelStyle(riskLevel);

  const handleDeleteClick = () => {
    setShowOptionsMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const result = await deleteSnapshotEntryAction(entry.entryId);
    if (result.success) {
      showToast("스냅샷 항목이 삭제되었습니다.", "success");
      setShowDeleteModal(false);
      onDelete?.();
    } else {
      showToast(result.error || "삭제에 실패했습니다.", "error");
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptionsMenu(false);
    onEdit?.();
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-fit relative group ${
        isSelectMode && isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200"
      }`}
      onClick={() => {
        if (isSelectMode) {
          onToggleSelection?.();
        } else {
          setLocalExpanded(!localExpanded);
        }
      }}
    >
      {/* 선택 모드 체크박스 */}
      {isSelectMode && (
        <div className="absolute top-3 left-3 z-20">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection?.();
            }}
          >
            {isSelected && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 헤더 - 메타 태그 세로 정렬 */}
      <div className={`px-4 pt-3 pb-4 ${isSelectMode ? "pl-12" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          {/* 세로 방향 메타 정보 */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Domain */}
            {entry.domain && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Domain
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.domain}
                </span>
              </div>
            )}
            {/* Project */}
            {entry.project && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Project
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.project}
                </span>
              </div>
            )}
            {/* Module */}
            {entry.module && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Module
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.module}
                </span>
              </div>
            )}
            {/* Feature */}
            {entry.feature && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Feature
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.feature}
                </span>
              </div>
            )}
            {/* 진행률 (접힌 상태에서만 표시 - 확장 시 상세 내용에서 표시됨) */}
            {!isExpanded && avgProgress !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  진행률
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">
                    {avgProgress}%
                  </span>
                </div>
              </div>
            )}
            {/* 리스크 레벨 (접힌 상태에서도 표시) */}
            {riskLevel > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Risk
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${riskStyle.bg} ${riskStyle.text}`}
                >
                  Lv.{riskLevel} {riskStyle.label}
                </span>
              </div>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-1 shrink-0 relative">
            {/* 선택 모드가 아닐 때만 버튼 표시 */}
            {!isSelectMode && (
              <>
            {/* 펼치기/접기 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalExpanded(!localExpanded);
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isExpanded
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
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

            {/* 옵션 버튼 */}
            <button
              ref={optionsButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all shrink-0"
              title="옵션"
              type="button"
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
              </>
            )}

            {/* 옵션 메뉴 팝오버 */}
            {showOptionsMenu && (
              <div
                ref={optionsMenuRef}
                className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    type="button"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>수정하기</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  type="button"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>삭제하기</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 펼친 내용 - ScrumCard 스타일 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 진행률 요약 */}
          {avgProgress !== null && (
            <div className="mx-4 my-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">평균 진행률</span>
                <span
                  className={`font-semibold ${
                    avgProgress === 100 ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  {avgProgress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    avgProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* PAST WEEK TASKS */}
          {pastWeekTasks.length > 0 && (
            <div className="mx-4 mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                PAST WEEK TASKS:
              </div>
              <ul className="space-y-1">
                {pastWeekTasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-700"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="flex-1">{task.title}</span>
                    <span
                      className={`shrink-0 text-[10px] font-medium ${
                        task.progress === 100
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      {task.progress}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk 표시 */}
          {(risks.length > 0 || riskLevel > 0) && (
            <div className="mx-4 mb-3 flex items-start gap-2 text-xs">
              <span
                className={`font-medium ${
                  riskLevel >= 3
                    ? "text-red-600"
                    : riskLevel >= 2
                    ? "text-orange-600"
                    : riskLevel >= 1
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                Risk:
              </span>
              <span className="text-gray-700">
                {risks.length > 0 ? risks.join(", ") : "미정"}
              </span>
            </div>
          )}

          {/* Collaborators 표시 (태그 형태) */}
          {collaborators.length > 0 && (
            <div className="mx-4 mb-3 flex items-start gap-2 text-xs">
              <span className="text-gray-500 font-medium shrink-0">with:</span>
              <div className="flex flex-wrap gap-1.5">
                {collaborators.map((c, i) => {
                  const style = getRelationStyle(c.relations);
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {c.name}
                      {style.label && (
                        <span className="opacity-75">({style.label})</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* THIS WEEK TASKS */}
          {thisWeekTasks.length > 0 && (
            <div className="mx-4 mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                THIS WEEK TASKS:
              </div>
              <ul className="space-y-1">
                {thisWeekTasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-700"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="flex-1">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pastWeekTasks.length === 0 && thisWeekTasks.length === 0 && (
            <p className="mx-4 mb-4 text-xs text-gray-400 text-center py-2">
              등록된 작업이 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={handleDeleteCancel}
          >
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              style={{
                background: "white",
                boxShadow:
                  "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <TrashIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      스냅샷 항목 삭제
                    </h3>
                    <p className="text-sm text-white/80">
                      이 작업은 되돌릴 수 없습니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <p className="text-gray-700">
                  정말로 이 스냅샷 항목을 삭제하시겠습니까?
                  <br />
                  <br />
                  삭제된 항목은 복구할 수 없습니다.
                </p>
              </div>

              {/* 버튼 */}
              <div
                className="flex gap-3 px-6 pb-6"
                style={{ background: "#f9fafb" }}
              >
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}
    </div>
  );
}

// Entry 행 (리스트용)
function EntryRow({
  entry,
  onEdit,
  onDelete,
  isSelectMode,
  isSelected,
  onToggleSelection,
}: {
  entry: SnapshotEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const { showToast } = useToast();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 옵션 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node) &&
        optionsButtonRef.current &&
        !optionsButtonRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(false);
      }
    }

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOptionsMenu]);

  const handleDeleteClick = () => {
    setShowOptionsMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const result = await deleteSnapshotEntryAction(entry.entryId);
    if (result.success) {
      showToast("스냅샷 항목이 삭제되었습니다.", "success");
      setShowDeleteModal(false);
      onDelete?.();
    } else {
      showToast(result.error || "삭제에 실패했습니다.", "error");
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptionsMenu(false);
    onEdit?.();
  };

  // 리스크 레벨
  const riskLevel = entry.risk_level || 0;
  const getRiskStyle = (level: number) => {
    if (level >= 3) return { bg: "bg-red-100", text: "text-red-600" };
    if (level >= 2) return { bg: "bg-orange-100", text: "text-orange-600" };
    if (level >= 1) return { bg: "bg-yellow-100", text: "text-yellow-600" };
    return null;
  };
  const riskStyle = getRiskStyle(riskLevel);

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-white rounded-xl border shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group relative ${
        isSelectMode && isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200"
      }`}
      onClick={() => {
        if (isSelectMode) {
          onToggleSelection?.();
        }
      }}
    >
      {/* 선택 모드 체크박스 */}
      {isSelectMode && (
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "bg-white border-gray-300"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection?.();
          }}
        >
          {isSelected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      )}

      {/* 옵션 버튼 - 선택 모드가 아닐 때만 표시 */}
      {!isSelectMode && (
      <div className="absolute top-2 right-2 z-10">
        <button
          ref={optionsButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowOptionsMenu(!showOptionsMenu);
          }}
          className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 shrink-0"
          title="옵션"
          type="button"
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

        {/* 옵션 메뉴 팝오버 */}
        {showOptionsMenu && (
          <div
            ref={optionsMenuRef}
            className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                type="button"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>수정하기</span>
              </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  type="button"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>삭제하기</span>
                </button>
          </div>
        )}
      </div>
      )}
      {/* Workload 뱃지 (첫 엔트리에만 표시) */}
      {entry.isFirstEntry && entry.workload_level && (
        <WorkloadBadge level={entry.workload_level} />
      )}

      {/* 태그 일렬 표시 */}
      <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
        {/* Domain */}
        {entry.domain && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-md shrink-0">
            {entry.domain}
          </span>
        )}
        {/* Project */}
        {entry.project && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-md shrink-0">
            {entry.project}
          </span>
        )}
        {/* Module */}
        {entry.module && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded-md shrink-0">
            {entry.module}
          </span>
        )}
        {/* Feature */}
        {entry.feature && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-600 rounded-md shrink-0">
            {entry.feature}
          </span>
        )}
        {/* Risk */}
        {riskStyle && (
          <span
            className={`px-2 py-0.5 text-[10px] font-medium ${riskStyle.bg} ${riskStyle.text} rounded-md shrink-0`}
          >
            Risk Lv.{riskLevel}
          </span>
        )}
      </div>


      {/* 화살표 */}
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={handleDeleteCancel}
          >
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              style={{
                background: "white",
                boxShadow:
                  "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <TrashIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      스냅샷 항목 삭제
                    </h3>
                    <p className="text-sm text-white/80">
                      이 작업은 되돌릴 수 없습니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <p className="text-gray-700">
                  정말로 이 스냅샷 항목을 삭제하시겠습니까?
                  <br />
                  <br />
                  삭제된 항목은 복구할 수 없습니다.
                </p>
              </div>

              {/* 버튼 */}
              <div
                className="flex gap-3 px-6 pb-6"
                style={{ background: "#f9fafb" }}
              >
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// 로딩 스켈레톤
function LoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 bg-gray-100 rounded-xl animate-pulse"
            style={{ height: 160 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// 빈 상태
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gray-100 rounded-2xl">
        <svg
          className="w-10 h-10 text-gray-400"
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
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        스냅샷이 없습니다
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        선택한 주차에 작성된 스냅샷이 없습니다.
        <br />
        우측 상단의 &quot;새로 작성하기&quot; 버튼으로 시작하세요.
      </p>
    </div>
  );
}
