"use client";

/**
 * 주차별 편집하기 화면
 *
 * - 기존 편집 UI(3열 구성) 재사용
 * - 스냅샷 선택 드롭다운
 * - "업데이트하기" 버튼으로 저장
 */

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  formatWeekRange,
  getCurrentISOWeek,
  getWeekOptions,
  getWeekDateRange,
  formatShortDate,
  formatWeekRangeCompact,
} from "@/lib/date/isoWeek";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import {
  SnapshotCardList,
  SnapshotCardListRef,
} from "@/components/weekly-scrum/manage/SnapshotCardList";
import { SnapshotEditForm } from "@/components/weekly-scrum/manage/SnapshotEditForm";
import { PlainTextPreview } from "@/components/weekly-scrum/manage/PlainTextPreview";
import { ResizeHandle } from "@/components/weekly-scrum/manage/ResizeHandle";
import {
  ToastProvider,
  useToast,
} from "@/components/weekly-scrum/manage/Toast";
import type { TempSnapshot } from "@/components/weekly-scrum/manage/types";
import {
  tempSnapshotToV2Json,
  tempSnapshotToPlainText,
} from "@/components/weekly-scrum/manage/types";
import { WorkloadLevelModal } from "@/components/weekly-scrum/manage/WorkloadLevelModal";
import { WeekTimeline } from "../../../../_components/WeekTimeline";
import {
  updateSnapshotAndEntries,
  createSnapshotAndEntries,
} from "../../../../_actions";
import type {
  SnapshotEntryPayload,
  UpdateSnapshotPayload,
  CreateSnapshotPayload,
} from "../../../../_actions";
import type {
  Database,
  PastWeekTask,
  Collaborator,
  WorkloadLevel,
} from "@/lib/supabase/types";
import {
  WORKLOAD_LEVEL_LABELS,
  WORKLOAD_LEVEL_COLORS,
} from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

interface SnapshotWithEntries {
  id: string;
  created_at: string;
  updated_at: string;
  workload_level?: WorkloadLevel | null;
  workload_note?: string | null;
  entries: SnapshotEntryRow[];
}

interface EditSnapshotsViewProps {
  year: number;
  week: number;
  snapshots: SnapshotWithEntries[];
  userId: string;
  workspaceId: string;
  displayName: string;
  memberNames?: string[];
  domainOptions?: string[];
  projectOptions?: string[];
  moduleOptions?: string[];
  featureOptions?: string[];
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

function convertEntryToTempSnapshot(
  entry: SnapshotEntryRow,
  index: number,
  displayName?: string
): TempSnapshot {
  // 새 DB 스키마: risks, collaborators 별도 컬럼
  // name이 비어있거나 "지정된 이름없음"이면 displayName 사용
  const entryName = entry.name?.trim();
  const finalName = 
    !entryName || entryName === "지정된 이름없음" || entryName === "사용자"
      ? (displayName || entryName || "")
      : entryName;
  
  return {
    tempId: entry.id,
    isOriginal: true,
    isDirty: false,
    createdAt: new Date(entry.created_at),
    updatedAt: new Date(entry.updated_at),
    name: finalName,
    domain: entry.domain,
    project: entry.project,
    module: entry.module || "",
    feature: entry.feature || "",
    pastWeek: {
      tasks: (entry.past_week?.tasks as PastWeekTask[]) || [],
      risk: (entry.risks as string[]) || null,
      riskLevel: entry.risk_level as 0 | 1 | 2 | 3 | null,
      collaborators: (entry.collaborators as Collaborator[]) || [],
    },
    thisWeek: {
      tasks: entry.this_week?.tasks || [],
    },
  };
}

// 새 빈 스냅샷 생성
function createEmptyTempSnapshot(displayName: string = ""): TempSnapshot {
  const now = new Date();
  return {
    tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isOriginal: false,
    isDirty: true,
    createdAt: now,
    updatedAt: now,
    name: displayName,
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
}

// 모바일 뷰 타입
type MobileView = "list" | "form";

function EditSnapshotsViewInner({
  year,
  week,
  snapshots,
  userId,
  workspaceId,
  displayName,
  memberNames,
  domainOptions,
  projectOptions,
  moduleOptions,
  featureOptions,
}: EditSnapshotsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // 모바일 감지 (768px 이하)
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // URL에서 snapshotId와 entryIndex 읽기
  const urlSnapshotId = searchParams.get("snapshotId");
  const urlEntryIndex = searchParams.get("entryIndex");

  // 스냅샷이 없으면 새 모드로 동작
  const isNewMode = snapshots.length === 0;

  // 현재 선택된 스냅샷 (URL 파라미터 우선)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(() => {
    if (urlSnapshotId && snapshots.some((s) => s.id === urlSnapshotId)) {
      return urlSnapshotId;
    }
    return snapshots[0]?.id || null;
  });
  const selectedSnapshotData = snapshots.find(
    (s) => s.id === selectedSnapshotId
  );

  // 엔트리들을 TempSnapshot으로 변환 (스냅샷이 없으면 빈 카드 하나 생성)
  const [tempSnapshots, setTempSnapshots] = useState<TempSnapshot[]>(() => {
    if (isNewMode) {
      return [createEmptyTempSnapshot(displayName)];
    }
    return (selectedSnapshotData?.entries || []).map((entry, index) =>
      convertEntryToTempSnapshot(entry, index, displayName)
    );
  });

  // 선택된 카드 ID (URL의 entryIndex 기반으로 초기 선택)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (urlEntryIndex !== null) {
      const entryIdx = parseInt(urlEntryIndex, 10);
      if (
        !isNaN(entryIdx) &&
        entryIdx >= 0 &&
        entryIdx < tempSnapshots.length
      ) {
        return tempSnapshots[entryIdx]?.tempId || null;
      }
    }
    return tempSnapshots[0]?.tempId || null;
  });
  const [deletedEntryIds, setDeletedEntryIds] = useState<string[]>([]);

  // Workload 상태 (스냅샷 단위)
  const [workloadLevel, setWorkloadLevel] = useState<WorkloadLevel | null>(
    () => selectedSnapshotData?.workload_level || null
  );
  const [workloadNote, setWorkloadNote] = useState(
    () => selectedSnapshotData?.workload_note || ""
  );
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  // 패널 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    DEFAULT_LEFT_PANEL_WIDTH
  );
  const [editPanelRatio, setEditPanelRatio] = useState(0.5);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [forceThreeColumn, setForceThreeColumn] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const weekRange = formatWeekRange(year, week);
  const selectedSnapshot =
    tempSnapshots.find((s) => s.tempId === selectedId) || null;

  // 주차 정보 (Past Week/This Week 라벨용)
  const weekInfo = {
    year,
    week,
    pastWeekLabel: `W${week
      .toString()
      .padStart(2, "0")} (${formatWeekRangeCompact(year, week)})`,
    thisWeekLabel: `W${(week + 1)
      .toString()
      .padStart(2, "0")} (${formatWeekRangeCompact(year, week + 1)})`,
  };

  // 주차별 스냅샷 갯수 맵
  const [snapshotCountByWeek, setSnapshotCountByWeek] = useState<
    Map<string, number>
  >(new Map());
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // 모바일 타임라인 상태
  const [isMobileTimelineOpen, setIsMobileTimelineOpen] = useState(false);

  // 최근 업데이트된 주차 추적 (애니메이션용)
  const [recentlyUpdatedWeek, setRecentlyUpdatedWeek] = useState<string | null>(null);

  // 주차별 스냅샷 갯수 조회
  const fetchSnapshotCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      const response = await fetch(
        `/api/manage/snapshots/counts?workspaceId=${workspaceId}&userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        const counts = data.counts || {};
        setSnapshotCountByWeek(
          new Map(Object.entries(counts).map(([k, v]) => [k, v as number]))
        );
      }
    } catch (error) {
      console.error("Failed to fetch snapshot counts:", error);
    } finally {
      setIsLoadingCounts(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    fetchSnapshotCounts();
  }, [fetchSnapshotCounts]);

  // 연도 상태 (WeekTimeline에서 연도 변경 시 임시 저장)
  const [tempYear, setTempYear] = useState(year);

  // 주차 변경 시 라우팅 (연도도 함께 고려)
  const handleWeekChange = (newWeek: number) => {
    if (tempYear !== year || newWeek !== week) {
      navigationProgress.start();
      router.push(`/manage/snapshots/${tempYear}/${newWeek}/edit`);
      setTempYear(year); // 라우팅 후 초기화
    }
  };

  // 연도 + 주차 통합 변경 핸들러
  const handleYearWeekChange = (newYear: number, newWeek: number) => {
    if (newYear !== year || newWeek !== week) {
      navigationProgress.start();
      router.push(`/manage/snapshots/${newYear}/${newWeek}/edit`);
    }
  };

  // 스냅샷 변경 시 엔트리 갱신
  const handleSnapshotChange = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    const snapshotData = snapshots.find((s) => s.id === snapshotId);
    const newTempSnapshots = (snapshotData?.entries || []).map((entry, index) =>
      convertEntryToTempSnapshot(entry, index, displayName)
    );
    setTempSnapshots(newTempSnapshots);
    setSelectedId(newTempSnapshots[0]?.tempId || null);
    setDeletedEntryIds([]);
    // Workload 상태도 갱신
    setWorkloadLevel(snapshotData?.workload_level || null);
    setWorkloadNote(snapshotData?.workload_note || "");
  };

  // 카드 선택
  const handleSelectCard = useCallback(
    (tempId: string) => {
      setSelectedId(tempId);
      // 모바일에서는 폼 뷰로 전환
      if (isMobile) {
        setMobileView("form");
      }
    },
    [isMobile]
  );

  // 카드 삭제
  const handleDeleteCard = useCallback(
    (tempId: string) => {
      setDeletedEntryIds((prev) => [...prev, tempId]);
      setTempSnapshots((prev) => {
        const newSnapshots = prev.filter((s) => s.tempId !== tempId);
        if (selectedId === tempId) {
          setSelectedId(newSnapshots[0]?.tempId || null);
        }
        return newSnapshots;
      });
    },
    [selectedId]
  );

  // 카드 복제
  const handleDuplicateCard = useCallback(
    (tempId: string) => {
      const newTempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      setTempSnapshots((prev) => {
        const target = prev.find((s) => s.tempId === tempId);
        if (!target) return prev;

        const now = new Date();
        const duplicated: TempSnapshot = {
          ...target,
          tempId: newTempId,
          isOriginal: false,
          isDirty: true,
          createdAt: now,
          updatedAt: now,
          // name이 비어있으면 현재 사용자의 displayName 사용
          name: target.name?.trim() || displayName,
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
        return newSnapshots;
      });

      // 상태 업데이트 후 복제된 카드 선택
      setSelectedId(newTempId);
    },
    [displayName]
  );

  // 카드 업데이트
  const handleUpdateCard = useCallback(
    (tempId: string, updates: Partial<TempSnapshot>) => {
      setTempSnapshots((prev) =>
        prev.map((s) => {
          if (s.tempId !== tempId) return s;
          
          // 식별자 필드(tempId, isOriginal, createdAt)는 보호
          const { tempId: _, isOriginal: __, createdAt: ___, ...safeUpdates } = updates;
          
          return {
            ...s,
            ...safeUpdates,
            isDirty: true,
            updatedAt: new Date(),
          };
        })
      );
    },
    []
  );

  // 빈 카드 추가
  const handleAddEmpty = useCallback(() => {
    const now = new Date();
    const newSnapshot: TempSnapshot = {
      tempId: `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      isOriginal: false,
      isDirty: true,
      createdAt: now,
      updatedAt: now,
      name: displayName,
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
  }, [displayName]);

  // 리사이즈 핸들러
  const handleLeftResize = useCallback((delta: number) => {
    setLeftPanelWidth((prev) =>
      Math.max(
        MIN_LEFT_PANEL_WIDTH,
        Math.min(MAX_LEFT_PANEL_WIDTH, prev + delta)
      )
    );
  }, []);

  const handleEditPreviewResize = useCallback(
    (delta: number) => {
      const containerWidth = window.innerWidth - leftPanelWidth - 10;
      const deltaRatio = delta / containerWidth;
      setEditPanelRatio((prev) =>
        Math.max(0.25, Math.min(0.75, prev + deltaRatio))
      );
    },
    [leftPanelWidth]
  );

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

  // 저장 버튼 클릭 시 모달 표시
  const handleSaveClick = async () => {
    // 새 모드에서만 엔트리 필수 검증 (편집 모드에서는 모두 삭제도 허용)
    if (isNewMode && tempSnapshots.length === 0) {
      showToast("저장할 항목이 없습니다.", "error");
      return;
    }

    // 편집 모드에서 워크로드 데이터가 이미 있으면 모달 띄우지 않고 바로 저장
    if (!isNewMode && workloadLevel) {
      await handleSaveConfirm(workloadLevel, workloadNote);
      return;
    }

    // 새 모드이거나 워크로드 데이터가 없으면 모달 표시
    setShowWorkloadModal(true);
  };

  // 워크로드만 임시로 갱신하는 핸들러 (모달에서 사용)
  const handleWorkloadUpdate = (level: WorkloadLevel | null, note: string) => {
    setWorkloadLevel(level);
    setWorkloadNote(note);
  };

  // 모달에서 확인 시 실제 저장
  const handleSaveConfirm = async (
    level: WorkloadLevel | null,
    note: string
  ) => {
    if (!level) {
      showToast("워크로드 레벨을 선택해주세요.", "error");
      return;
    }

    setWorkloadLevel(level);
    setWorkloadNote(note);
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
          relations: c.relations,
        })),
      }));

      if (isNewMode) {
        // 새 모드: 스냅샷 생성
        const payload: CreateSnapshotPayload = {
          entries,
          workloadLevel: level || null,
          workloadNote: note.trim() || null,
        };

        const result = await createSnapshotAndEntries(year, week, payload);

        if (result.success) {
          setShowWorkloadModal(false);
          showToast("신규 등록 완료!", "success");
          router.refresh();
        } else {
          showToast(result.error || "저장 실패", "error");
        }
      } else {
        // 편집 모드: 스냅샷 업데이트
        if (!selectedSnapshotId) return;

        const payload: UpdateSnapshotPayload = {
          entries,
          deletedEntryIds,
          workloadLevel: level || undefined,
          workloadNote: note.trim() || null,
        };

        const result = await updateSnapshotAndEntries(
          selectedSnapshotId,
          payload
        );

        if (result.success) {
          setShowWorkloadModal(false);
          if (result.deleted) {
            // 엔트리가 모두 삭제되어 스냅샷도 삭제된 경우
            showToast("스냅샷이 삭제되었습니다.", "success");
            navigationProgress.start();
            router.push("/manage/snapshots");
          } else {
            showToast("업데이트 완료!", "success");
            
            // 주차별 카운트 갱신
            await fetchSnapshotCounts();
            
            // 애니메이션 효과를 위한 최근 업데이트 주차 설정
            const weekKey = `${year}-${week}`;
            setRecentlyUpdatedWeek(weekKey);
            setTimeout(() => setRecentlyUpdatedWeek(null), 2000);
            
            router.refresh();
          }
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
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* 모바일: Overlay */}
      {isMobileTimelineOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileTimelineOpen(false)}
        />
      )}

      {/* 모바일: 주차 타임라인 (하단 Sheet) */}
      <aside
        className={`
          fixed lg:hidden z-50 bg-white border-[#d0d7de] overflow-y-auto transition-transform duration-300
          inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t shadow-2xl
          ${isMobileTimelineOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="p-4 space-y-4">
          {/* Mobile Sheet 드래그 핸들 */}
          <div className="flex justify-center -mt-2 mb-2">
            <div className="w-12 h-1 bg-[#d0d7de] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#24292f]">주차 선택</h2>
            <button
              onClick={() => setIsMobileTimelineOpen(false)}
              className="p-1 text-[#57606a] hover:text-[#24292f] transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Week Timeline */}
          <WeekTimeline
            year={year}
            week={week}
            onYearChange={(newYear) => {
              setTempYear(newYear);
            }}
            onWeekChange={(w) => {
              handleWeekChange(w);
              setIsMobileTimelineOpen(false);
            }}
            snapshotCountByWeek={snapshotCountByWeek}
            isLoading={isLoadingCounts}
            className="w-full"
            disableEmptyWeeks={true}
            recentlyUpdatedWeek={recentlyUpdatedWeek}
          />
        </div>
      </aside>

      {/* 좌측: 주차 타임라인 (PC) */}
      <aside className="hidden lg:flex lg:w-80 lg:shrink-0 border-r border-[#d0d7de] overflow-y-auto">
        <WeekTimeline
          year={year}
          week={week}
          onYearChange={(newYear) => {
            setTempYear(newYear);
          }}
          onWeekChange={(newWeek) => {
            handleWeekChange(newWeek);
          }}
          snapshotCountByWeek={snapshotCountByWeek}
          isLoading={isLoadingCounts}
          className="w-full"
          disableEmptyWeeks={true}
          recentlyUpdatedWeek={recentlyUpdatedWeek}
        />
      </aside>

      {/* 우측: 편집 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 툴바 */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-3 md:px-4 py-2 md:py-3 flex flex-col gap-2 shrink-0">
          {/* 첫 번째 줄 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* 목록으로 버튼 */}
              <button
                onClick={() => {
                  navigationProgress.start();
                  router.push("/manage/snapshots");
                }}
                className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
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
                <span className="text-xs font-medium hidden sm:inline">
                  목록으로
                </span>
              </button>

              {/* 모바일: 주차 선택 버튼 */}
              <button
                onClick={() => setIsMobileTimelineOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0969da] bg-[#ddf4ff] rounded-lg hover:bg-[#b6e3ff] transition-colors shrink-0"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {year}년 W{String(week).padStart(2, "0")}
                </span>
              </button>

              {/* PC: 주차 정보 표시 */}
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <div className="h-4 w-px bg-gray-200" />
                <span className="font-semibold text-[#0969da]">
                  {year}년 W{String(week).padStart(2, "0")}
                </span>
                <span className="text-[#57606a]">({weekRange})</span>
              </div>
            </div>

            {/* 우측: 워크로드, 엔트리 갯수, 업데이트 버튼 */}
            <div className="relative flex items-center gap-2 md:ml-0">
              {/* 워크로드 태그 및 편집 아이콘 - 모바일/데스크톱 모두 표시 */}
              {workloadLevel && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md ${WORKLOAD_LEVEL_COLORS[workloadLevel].bg} ${WORKLOAD_LEVEL_COLORS[workloadLevel].text} border ${WORKLOAD_LEVEL_COLORS[workloadLevel].border}`}
                  >
                    {workloadLevel === "light" && "🌿"}
                    {workloadLevel === "normal" && "⚡"}
                    {workloadLevel === "burden" && "🔥"}
                    <span>{WORKLOAD_LEVEL_LABELS[workloadLevel]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWorkloadModal(true);
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="워크로드 편집"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
                  </button>
                </div>
              )}

              {/* 업데이트 버튼 - 모바일/데스크톱 모두 표시 */}
              <LoadingButton
                onClick={handleSaveClick}
                disabled={isSaving}
                isLoading={isSaving}
                loadingText="저장 중..."
                variant="primary"
                size="sm"
                icon={
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                }
              >
                {isNewMode ? "신규 등록" : "업데이트"}
              </LoadingButton>
            </div>
          </div>

          {/* 두 번째 줄: 스냅샷 선택 (PC 전용, 복수 스냅샷이 있을 때만) */}
          {snapshots.length > 1 && selectedSnapshotId && (
            <div className="hidden md:flex items-center gap-2">
              <div className="h-4 w-px bg-gray-200" />
              <select
                value={selectedSnapshotId}
                onChange={(e) => handleSnapshotChange(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                {snapshots.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    스냅샷 {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isMobile ? (
          <div className="flex-1 flex flex-col min-h-0">
          {mobileView === "list" ? (
            <div className="flex-1 bg-white overflow-hidden">
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
          ) : (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* 뒤로가기 버튼 */}
              <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  목록으로 돌아가기
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                {selectedSnapshot ? (
                  <SnapshotEditForm
                    key={selectedSnapshot.tempId}
                    snapshot={selectedSnapshot}
                    onUpdate={(updates) =>
                      handleUpdateCard(selectedSnapshot.tempId, updates)
                    }
                    onFocusSection={setFocusedSection}
                    activeSection={
                      focusedSection as
                        | import("@/components/weekly-scrum/manage/SnapshotEditForm").FormSection
                        | null
                    }
                    compact
                    singleColumn
                    hideName
                    weekInfo={weekInfo}
                    forceThreeColumn={forceThreeColumn}
                    onToggleThreeColumn={setForceThreeColumn}
                    nameOptions={memberNames}
                  />
                ) : (
                  <EmptyState onAddEmpty={handleAddEmpty} />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PC: 기존 3열 레이아웃 */
        <div className="flex-1 flex min-h-0">
          {/* 좌측: 카드 리스트 */}
          <div
            className="border-r border-gray-100 bg-white flex flex-col shrink-0"
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
            className="bg-white overflow-y-auto min-w-0 shrink-0 bg-gradient-to-b from-gray-50 to-white"
            style={{
              width: forceThreeColumn
                ? `calc((100% - ${leftPanelWidth}px - 12px) * ${editPanelRatio})`
                : "100%",
            }}
          >
            {selectedSnapshot ? (
              <SnapshotEditForm
                key={selectedSnapshot.tempId}
                snapshot={selectedSnapshot}
                onUpdate={(updates) =>
                  handleUpdateCard(selectedSnapshot.tempId, updates)
                }
                onFocusSection={setFocusedSection}
                activeSection={
                  focusedSection as
                    | import("@/components/weekly-scrum/manage/SnapshotEditForm").FormSection
                    | null
                }
                compact
                singleColumn
                hideName
                weekInfo={weekInfo}
                forceThreeColumn={forceThreeColumn}
                onToggleThreeColumn={setForceThreeColumn}
                nameOptions={memberNames}
                domainOptions={domainOptions}
                projectOptions={projectOptions}
                moduleOptions={moduleOptions}
                featureOptions={featureOptions}
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
                  focusedSection={
                    focusedSection as
                      | import("@/components/weekly-scrum/manage/PlainTextPreview").PreviewSection
                      | null
                  }
                  onSectionClick={(section) => setFocusedSection(section)}
                  displayName={displayName}
                />
              </div>
            </>
          )}
        </div>
        )}
      </div>

      {/* Workload Level 모달 */}
      <WorkloadLevelModal
        isOpen={showWorkloadModal}
        onClose={() => setShowWorkloadModal(false)}
        onConfirm={(level, note) => {
          handleWorkloadUpdate(level, note);
          setShowWorkloadModal(false);
        }}
        year={year}
        week={week}
        initialLevel={workloadLevel}
        initialNote={workloadNote}
        isLoading={false}
        required={false}
        confirmText="적용"
      />
    </div>
  );
}

function EmptyState({ onAddEmpty }: { onAddEmpty: () => void }) {
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
      <Suspense fallback={<LogoLoadingSpinner className="h-full" />}>
        <EditSnapshotsViewInner {...props} />
      </Suspense>
    </ToastProvider>
  );
}
