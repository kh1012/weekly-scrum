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
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  formatWeekRange,
  getCurrentISOWeek,
  getWeekOptions,
  getWeekDateRange,
  formatShortDate,
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
import {
  updateSnapshotAndEntries,
  createSnapshotAndEntries,
} from "../../../../_actions";
import type { SnapshotEntryPayload } from "../../../../_actions";
import type {
  Database,
  PastWeekTask,
  Collaborator,
} from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

interface SnapshotWithEntries {
  id: string;
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
  displayName: string;
}

// 좌측 패널 크기 제한
const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 480;
const DEFAULT_LEFT_PANEL_WIDTH = 280;

function convertEntryToTempSnapshot(
  entry: SnapshotEntryRow,
  index: number
): TempSnapshot {
  // 새 DB 스키마: risks, collaborators 별도 컬럼
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
    return (selectedSnapshotData?.entries || []).map(
      convertEntryToTempSnapshot
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

  // 주차별 스냅샷 갯수 맵
  const [snapshotCountByWeek, setSnapshotCountByWeek] = useState<
    Map<string, number>
  >(new Map());

  // 주차 선택 드롭다운 상태
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const weekButtonRef = useRef<HTMLButtonElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);
  const selectedWeekRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const currentWeekInfo = useMemo(() => getCurrentISOWeek(), []);

  // 주차 옵션 (현재 년도 기준)
  const weekOptionsWithRange = useMemo(() => {
    const weekOpts = getWeekOptions(year);
    return weekOpts.map((w) => {
      const { weekStart, weekEnd } = getWeekDateRange(year, w);
      const isCurrentWeek =
        currentWeekInfo.year === year && currentWeekInfo.week === w;
      return {
        week: w,
        label: `W${w.toString().padStart(2, "0")}`,
        range: `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`,
        isCurrentWeek,
      };
    });
  }, [year, currentWeekInfo]);

  // 드롭다운 열 때 위치 계산
  const openWeekDropdown = () => {
    if (weekButtonRef.current) {
      const rect = weekButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsWeekDropdownOpen(!isWeekDropdownOpen);
  };

  // 클릭 외부 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(event.target as Node) &&
        weekButtonRef.current &&
        !weekButtonRef.current.contains(event.target as Node)
      ) {
        setIsWeekDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 선택된 주차로 스크롤
  useEffect(() => {
    if (isWeekDropdownOpen && selectedWeekRef.current) {
      selectedWeekRef.current.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    }
  }, [isWeekDropdownOpen]);

  // 주차별 스냅샷 갯수 조회
  useEffect(() => {
    async function fetchSnapshotCounts() {
      try {
        const response = await fetch(
          `/api/manage/snapshots/counts?workspaceId=${workspaceId}&userId=${userId}&year=${year}`
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
      }
    }
    fetchSnapshotCounts();
  }, [year, workspaceId, userId]);

  // 주차 변경 시 라우팅
  const handleWeekChange = (newWeek: number) => {
    setIsWeekDropdownOpen(false);
    if (newWeek !== week) {
      navigationProgress.start();
      router.push(`/manage/snapshots/${year}/${newWeek}/edit`);
    }
  };

  // 스냅샷 변경 시 엔트리 갱신
  const handleSnapshotChange = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    const snapshotData = snapshots.find((s) => s.id === snapshotId);
    const newTempSnapshots = (snapshotData?.entries || []).map(
      convertEntryToTempSnapshot
    );
    setTempSnapshots(newTempSnapshots);
    setSelectedId(newTempSnapshots[0]?.tempId || null);
    setDeletedEntryIds([]);
  };

  // 카드 선택
  const handleSelectCard = useCallback((tempId: string) => {
    setSelectedId(tempId);
    // 모바일에서는 폼 뷰로 전환
    if (isMobile) {
      setMobileView("form");
    }
  }, [isMobile]);

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
        prev.map((s) =>
          s.tempId === tempId
            ? { ...s, ...updates, isDirty: true, updatedAt: new Date() }
            : s
        )
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

  // 저장 (새 모드일 때는 생성, 편집 모드일 때는 업데이트)
  const handleSave = async () => {
    if (tempSnapshots.length === 0) {
      showToast("저장할 항목이 없습니다.", "error");
      return;
    }

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

      if (isNewMode) {
        // 새 모드: 스냅샷 생성
        const result = await createSnapshotAndEntries(year, week, { entries });

        if (result.success) {
          showToast("신규 등록 완료!", "success");
          router.refresh();
        } else {
          showToast(result.error || "저장 실패", "error");
        }
      } else {
        // 편집 모드: 스냅샷 업데이트
        if (!selectedSnapshotId) return;

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
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("저장 중 오류가 발생했습니다", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* 상단 툴바 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-3 md:px-4 py-2 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
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
            <span className="text-xs font-medium hidden sm:inline">목록으로</span>
          </button>

          <div className="h-4 w-px bg-gray-200" />

          {/* 주차 선택 드롭다운 */}
          <div className="relative">
            <button
              ref={weekButtonRef}
              type="button"
              onClick={openWeekDropdown}
              className="flex items-center gap-2 h-9 rounded-lg px-3 text-sm font-medium bg-gray-50 transition-colors hover:bg-gray-100"
            >
              <span className="font-semibold text-gray-900">{year}년</span>
              <span className="font-semibold text-gray-900">
                W{week.toString().padStart(2, "0")}
              </span>
              <span className="text-gray-500 text-xs">({weekRange})</span>
              {currentWeekInfo.year === year &&
                currentWeekInfo.week === week && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                    현재
                  </span>
                )}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isWeekDropdownOpen ? "rotate-180" : ""
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

            {/* Portal로 렌더링 */}
            {isWeekDropdownOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={weekDropdownRef}
                  className="fixed bg-white rounded-xl shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto min-w-[240px]"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    zIndex: 9999,
                  }}
                >
                  {weekOptionsWithRange.map((w) => {
                    const weekKey = `${year}-${w.week}`;
                    const count = snapshotCountByWeek.get(weekKey) || 0;
                    const hasSnapshots = count > 0;

                    return (
                      <button
                        key={w.week}
                        ref={w.week === week ? selectedWeekRef : null}
                        type="button"
                        onClick={() => handleWeekChange(w.week)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                          w.week === week
                            ? "bg-gray-100 font-medium"
                            : "hover:bg-gray-50"
                        } ${
                          w.isCurrentWeek ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* 스냅샷 갯수 표시 */}
                          {hasSnapshots ? (
                            <span className="w-5 h-5 text-[10px] bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                              {count}
                            </span>
                          ) : (
                            <span className="w-[18px] h-[18px] flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            </span>
                          )}
                          <span className="font-medium">{w.label}</span>
                          {w.isCurrentWeek && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                              현재
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{w.range}</span>
                      </button>
                    );
                  })}
                </div>,
                document.body
              )}
          </div>

          {/* 스냅샷 선택 드롭다운 */}
          {snapshots.length > 1 && selectedSnapshotId && (
            <>
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
            </>
          )}

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-gray-700">
              {tempSnapshots.length}개 엔트리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 미리보기 토글 - 모바일에서 숨김 */}
          <label className="hidden md:flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={forceThreeColumn}
                onChange={(e) => setForceThreeColumn(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors ${
                  forceThreeColumn
                    ? "bg-gray-900"
                    : "bg-gray-200 group-hover:bg-gray-300"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  forceThreeColumn ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">
              미리보기
            </span>
          </label>

          <div className="hidden md:block h-6 w-px bg-gray-200" />

          {/* 업데이트하기 버튼 */}
          <LoadingButton
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            loadingText="저장 중..."
            variant="secondary"
            size="md"
            icon={
              <svg
                className="w-4 h-4"
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
            className="text-white bg-gray-900 hover:bg-gray-800"
            gradient={false}
          >
            {isNewMode ? "신규 등록하기" : "업데이트하기"}
          </LoadingButton>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {isMobile ? (
        /* 모바일: 단일 뷰 (리스트 또는 폼) */
        <div className="flex-1 flex flex-col min-h-0">
          {mobileView === "list" ? (
            /* 모바일: 카드 리스트 */
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
            /* 모바일: 편집 폼 */
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* 뒤로가기 버튼 */}
              <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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
                />
              </div>
            </>
          )}
        </div>
      )}
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
