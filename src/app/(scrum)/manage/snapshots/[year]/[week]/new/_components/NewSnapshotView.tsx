"use client";

/**
 * 새로 작성하기 화면
 *
 * 시작 옵션:
 * 1. 데이터 불러오기 (기존 주차별 데이터에서 불러오기)
 * 2. 새로 작성하기 (빈 상태에서 시작)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { formatWeekRange, formatWeekRangeCompact } from "@/lib/utils/date";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LoadingButton } from "@/components/common/LoadingButton";
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
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import type { TempSnapshot } from "@/components/weekly-scrum/manage/types";
import {
  createEmptySnapshot,
  tempSnapshotToV2Json,
  tempSnapshotToPlainText,
  convertToTempSnapshot,
} from "@/components/weekly-scrum/manage/types";
import {
  validateSnapshots,
  formatMissingFieldsMessage,
} from "@/components/weekly-scrum/manage/snapshotValidation";
import { WorkloadLevelModal } from "@/components/weekly-scrum/manage/WorkloadLevelModal";
import { LastWeekNextFab } from "@/components/snapshots/LastWeekNextFab";
import { createSnapshotAndEntries } from "../../../../_actions";
import type {
  SnapshotEntryPayload,
  CreateSnapshotPayload,
} from "../../../../_actions";
import type {
  PastWeekTask,
  Collaborator,
  WorkloadLevel,
} from "@/lib/supabase/types";

// 기존 주차별 데이터 타입
interface WeekData {
  key: string;
  year: number;
  week: string;
  weekStartDate: string;
  weekEndDate: string;
  entriesCount: number;
  entries: {
    id: string;
    name: string;
    domain: string;
    project: string;
    module: string | null;
    feature: string | null;
    past_week_tasks: PastWeekTask[];
    this_week_tasks: string[];
    risk: string[] | null;
    risk_level: number | null;
    collaborators: Collaborator[];
  }[];
}

interface NewSnapshotViewProps {
  year: number;
  week: number;
  userId: string;
  workspaceId: string;
  /** 현재 로그인한 사용자의 display_name */
  displayName: string;
  /** 협업자 이름 옵션 (profiles 테이블에서 동적으로 로드) */
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

function NewSnapshotViewInner({
  year,
  week,
  userId,
  workspaceId,
  displayName,
  memberNames,
  domainOptions,
  projectOptions,
  moduleOptions,
  featureOptions,
}: NewSnapshotViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const cardListRef = useRef<SnapshotCardListRef>(null);

  // URL에서 mode 파라미터 확인 (load: 데이터 불러오기 모달, empty: 빈 편집)
  const urlMode = searchParams.get("mode");

  // 화면 모드: entry (진입점) / editor (편집) / loading (데이터 불러오기 모달)
  const [mode, setMode] = useState<"entry" | "editor" | "loading">(() => {
    // URL에서 mode=empty면 바로 editor로 시작
    if (urlMode === "empty") return "editor";
    // URL에서 mode=load면 데이터 불러오기 모달 표시
    if (urlMode === "load") return "loading";
    return "entry";
  });

  // 엔트리들
  const [tempSnapshots, setTempSnapshots] = useState<TempSnapshot[]>(() => {
    // URL에서 mode=empty면 빈 스냅샷 하나 생성
    if (urlMode === "empty") {
      const emptySnapshot = createEmptySnapshot(displayName);
      return [emptySnapshot];
    }
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (urlMode === "empty") {
      // 초기 selectedId는 tempSnapshots 첫 번째에서 가져올 것이므로 별도 생성 불필요
      return null;
    }
    return null;
  });

  // 패널 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    DEFAULT_LEFT_PANEL_WIDTH
  );
  const [editPanelRatio, setEditPanelRatio] = useState(0.5);
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  // 미리보기는 항상 표시 (토글 삭제)
  const forceThreeColumn = true;
  const [isSaving, setIsSaving] = useState(false);
  // 클라이언트 마운트 여부 (hydration 에러 방지)
  const [isMounted, setIsMounted] = useState(false);

  // 데이터 불러오기 상태
  const [myWeeklyData, setMyWeeklyData] = useState<WeekData[]>([]);
  const [isLoadingMyData, setIsLoadingMyData] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [autoLoadTriggered, setAutoLoadTriggered] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  // Workload 상태 (스냅샷 단위)
  const [workloadLevel, setWorkloadLevel] = useState<WorkloadLevel | null>(
    null
  );
  const [workloadNote, setWorkloadNote] = useState("");
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  // 모바일 Drawer 상태
  const [mobileCardDrawerOpen, setMobileCardDrawerOpen] = useState(false);
  const [mobilePreviewDrawerOpen, setMobilePreviewDrawerOpen] = useState(false);

  // 초기 데이터 저장 (변경사항 추적용)
  const initialSnapshotsRef = useRef<TempSnapshot[]>([]);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // 초기 데이터 저장 (editor 모드 진입 시)
  useEffect(() => {
    if (
      mode === "editor" &&
      tempSnapshots.length > 0 &&
      initialSnapshotsRef.current.length === 0
    ) {
      // 깊은 복사로 초기 데이터 저장
      initialSnapshotsRef.current = tempSnapshots.map((s) => ({
        ...s,
        pastWeek: {
          ...s.pastWeek,
          tasks: s.pastWeek.tasks.map((t) => ({ ...t })),
          risk: s.pastWeek.risk ? [...s.pastWeek.risk] : null,
          collaborators: s.pastWeek.collaborators.map((c) => ({
            ...c,
            relations: c.relations ? [...c.relations] : undefined,
          })),
        },
        thisWeek: {
          tasks: [...s.thisWeek.tasks],
        },
      }));
    }
  }, [mode, tempSnapshots]);

  // 변경사항 계산 함수
  const calculateChanges = useCallback(() => {
    if (initialSnapshotsRef.current.length === 0) return 0;

    const initial = initialSnapshotsRef.current;
    const current = tempSnapshots;

    // 엔트리 개수 변경
    if (initial.length !== current.length) {
      return Math.abs(initial.length - current.length);
    }

    // 각 엔트리 비교
    let changeCount = 0;
    const initialMap = new Map(initial.map((s) => [s.tempId, s]));

    for (const currentSnapshot of current) {
      const initialSnapshot = initialMap.get(currentSnapshot.tempId);
      if (!initialSnapshot) {
        changeCount++;
        continue;
      }

      // 각 필드 비교
      if (
        currentSnapshot.name !== initialSnapshot.name ||
        currentSnapshot.domain !== initialSnapshot.domain ||
        currentSnapshot.project !== initialSnapshot.project ||
        currentSnapshot.module !== initialSnapshot.module ||
        currentSnapshot.feature !== initialSnapshot.feature
      ) {
        changeCount++;
        continue;
      }

      // pastWeek.tasks 비교
      const currentTasks = JSON.stringify(currentSnapshot.pastWeek.tasks);
      const initialTasks = JSON.stringify(initialSnapshot.pastWeek.tasks);
      if (currentTasks !== initialTasks) {
        changeCount++;
        continue;
      }

      // pastWeek.risk 비교
      const currentRisk = JSON.stringify(currentSnapshot.pastWeek.risk);
      const initialRisk = JSON.stringify(initialSnapshot.pastWeek.risk);
      if (currentRisk !== initialRisk) {
        changeCount++;
        continue;
      }

      // pastWeek.riskLevel 비교
      if (
        currentSnapshot.pastWeek.riskLevel !==
        initialSnapshot.pastWeek.riskLevel
      ) {
        changeCount++;
        continue;
      }

      // pastWeek.collaborators 비교
      const currentCollaborators = JSON.stringify(
        currentSnapshot.pastWeek.collaborators
      );
      const initialCollaborators = JSON.stringify(
        initialSnapshot.pastWeek.collaborators
      );
      if (currentCollaborators !== initialCollaborators) {
        changeCount++;
        continue;
      }

      // thisWeek.tasks 비교
      const currentThisWeekTasks = JSON.stringify(
        currentSnapshot.thisWeek.tasks
      );
      const initialThisWeekTasks = JSON.stringify(
        initialSnapshot.thisWeek.tasks
      );
      if (currentThisWeekTasks !== initialThisWeekTasks) {
        changeCount++;
        continue;
      }
    }

    return changeCount;
  }, [tempSnapshots]);

  const changeCount = calculateChanges();

  // 본인 주차별 데이터 불러오기
  const fetchMyEntries = useCallback(async () => {
    setIsLoadingMyData(true);
    try {
      const response = await fetch(
        `/api/manage/snapshots/my-entries?workspaceId=${workspaceId}&userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMyWeeklyData(data.weeks || []);
      }
    } catch (error) {
      console.error("Failed to fetch my entries:", error);
    } finally {
      setIsLoadingMyData(false);
    }
  }, [workspaceId, userId]);

  // mode=loading일 때 데이터 로드
  useEffect(() => {
    if (mode === "loading" && myWeeklyData.length === 0) {
      fetchMyEntries();
    }
  }, [mode, myWeeklyData.length, fetchMyEntries]);

  // URL에서 weeks 파라미터 읽어서 자동 선택
  useEffect(() => {
    if (urlMode === "load" && myWeeklyData.length > 0 && !autoLoadTriggered) {
      const weeksParam = searchParams.get("weeks");
      if (weeksParam) {
        const weekKeys = weeksParam.split(",").filter(Boolean);
        if (weekKeys.length > 0) {
          setSelectedWeeks(new Set(weekKeys));
          setAutoLoadTriggered(true);
          setIsAutoLoading(true);
        }
      }
    }
  }, [urlMode, myWeeklyData.length, searchParams, autoLoadTriggered]);

  // 자동 선택된 주차가 있으면 로드
  useEffect(() => {
    if (
      autoLoadTriggered &&
      selectedWeeks.size > 0 &&
      myWeeklyData.length > 0 &&
      tempSnapshots.length === 0
    ) {
      const loadedSnapshots: TempSnapshot[] = [];
      selectedWeeks.forEach((weekKey) => {
        const weekData = myWeeklyData.find((w) => w.key === weekKey);
        if (weekData) {
          weekData.entries.forEach((entry: Record<string, unknown>) => {
            const pastWeekData = entry.past_week as
              | { tasks?: PastWeekTask[] }
              | undefined;
            const thisWeekData = entry.this_week as
              | { tasks?: string[] }
              | undefined;

            const snapshot = convertToTempSnapshot({
              name: (entry.name as string) || "",
              domain: (entry.domain as string) || "",
              project: (entry.project as string) || "",
              module: (entry.module as string) ?? undefined,
              feature: (entry.feature as string) ?? undefined,
              pastWeek: {
                tasks: pastWeekData?.tasks || [],
                risk: (entry.risks as string[]) || null,
                riskLevel: entry.risk_level as number | null,
                collaborators: (entry.collaborators as Collaborator[]) || [],
              },
              thisWeek: {
                tasks: thisWeekData?.tasks || [],
              },
            });
            loadedSnapshots.push(snapshot);
          });
        }
      });

      if (loadedSnapshots.length > 0) {
        setTempSnapshots(loadedSnapshots);
        setSelectedId(loadedSnapshots[0].tempId);
        setMode("editor");
        setIsAutoLoading(false);
        showToast(
          `${loadedSnapshots.length}개 엔트리를 불러왔습니다.`,
          "success"
        );
      }
    }
  }, [
    autoLoadTriggered,
    selectedWeeks,
    myWeeklyData,
    tempSnapshots.length,
    showToast,
  ]);

  // URL mode=empty로 시작 시 초기 selectedId 설정
  useEffect(() => {
    if (
      urlMode === "empty" &&
      tempSnapshots.length > 0 &&
      selectedId === null
    ) {
      setSelectedId(tempSnapshots[0].tempId);
    }
  }, [urlMode, tempSnapshots, selectedId]);

  // 클라이언트 마운트 확인 (hydration 에러 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 선택된 주차의 엔트리 불러오기
  const handleLoadFromWeeks = () => {
    if (selectedWeeks.size === 0) return;

    const loadedSnapshots: TempSnapshot[] = [];
    selectedWeeks.forEach((weekKey) => {
      const weekData = myWeeklyData.find((w) => w.key === weekKey);
      if (weekData) {
        weekData.entries.forEach((entry: Record<string, unknown>) => {
          // 새 DB 스키마: risks, collaborators 별도 컬럼
          const pastWeekData = entry.past_week as
            | { tasks?: PastWeekTask[] }
            | undefined;
          const thisWeekData = entry.this_week as
            | { tasks?: string[] }
            | undefined;

          const snapshot = convertToTempSnapshot({
            name: (entry.name as string) || "",
            domain: (entry.domain as string) || "",
            project: (entry.project as string) || "",
            module: (entry.module as string) ?? undefined,
            feature: (entry.feature as string) ?? undefined,
            pastWeek: {
              tasks: pastWeekData?.tasks || [],
              risk: (entry.risks as string[]) || null,
              riskLevel: entry.risk_level as number | null,
              collaborators: (entry.collaborators as Collaborator[]) || [],
            },
            thisWeek: {
              tasks: thisWeekData?.tasks || [],
            },
          });
          loadedSnapshots.push(snapshot);
        });
      }
    });

    if (loadedSnapshots.length > 0) {
      setTempSnapshots(loadedSnapshots);
      setSelectedId(loadedSnapshots[0].tempId);
      setMode("editor");
      showToast(
        `${loadedSnapshots.length}개 엔트리를 불러왔습니다.`,
        "success"
      );
    }
  };

  // 주차 토글
  const toggleWeek = (weekKey: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

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

  // 새로 작성하기 (빈 상태로 시작)
  const handleStartEmpty = () => {
    const newSnapshot = createEmptySnapshot(displayName);
    setTempSnapshots([newSnapshot]);
    setSelectedId(newSnapshot.tempId);
    setMode("editor");
  };

  // 카드 선택
  const handleSelectCard = useCallback((tempId: string) => {
    setSelectedId(tempId);
  }, []);

  // 카드 삭제
  const handleDeleteCard = useCallback(
    (tempId: string) => {
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
          const {
            tempId: _,
            isOriginal: __,
            createdAt: ___,
            ...safeUpdates
          } = updates;

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
    const newSnapshot = createEmptySnapshot(displayName);
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

  // 신규 등록하기 버튼 클릭 시 모달 표시
  const handleSaveClick = () => {
    if (tempSnapshots.length === 0) {
      showToast("저장할 엔트리가 없습니다.", "error");
      return;
    }
    setShowWorkloadModal(true);
  };

  // 모달에서 확인 시 실제 저장
  const handleSaveConfirm = async (level: WorkloadLevel, note: string) => {
    // 필수값 검증
    const validation = validateSnapshots(tempSnapshots);
    if (!validation.isValid) {
      showToast(formatMissingFieldsMessage(validation.missingFields), "error");
      return;
    }

    setWorkloadLevel(level);
    setWorkloadNote(note);
    setIsSaving(true);

    try {
      const entries: SnapshotEntryPayload[] = tempSnapshots.map((s) => ({
        // name이 비어있으면 displayName 사용 (서버에서도 처리하지만 클라이언트에서도 처리)
        name: s.name?.trim() || displayName || "",
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

      const payload: CreateSnapshotPayload = {
        entries,
        workloadLevel: level,
        workloadNote: note.trim() || null,
      };

      const result = await createSnapshotAndEntries(year, week, payload);

      if (result.success) {
        setShowWorkloadModal(false);
        // 저장 후 초기 데이터 업데이트
        initialSnapshotsRef.current = tempSnapshots.map((s) => ({
          ...s,
          pastWeek: {
            ...s.pastWeek,
            tasks: s.pastWeek.tasks.map((t) => ({ ...t })),
            risk: s.pastWeek.risk ? [...s.pastWeek.risk] : null,
            collaborators: s.pastWeek.collaborators.map((c) => ({
              ...c,
              relations: c.relations ? [...c.relations] : undefined,
            })),
          },
          thisWeek: {
            tasks: [...s.thisWeek.tasks],
          },
        }));
        showToast("신규 등록 완료!", "success");
        navigationProgress.start();
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

  // 진입점 화면 - 전체 너비 사용
  if (mode === "entry") {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* 상단 헤더 - 좌측 정렬 */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 border-b border-gray-100">
          <button
            onClick={() => {
              navigationProgress.start();
              router.push("/manage/snapshots");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
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
            <span className="hidden sm:inline">스냅샷 목록으로</span>
            <span className="sm:hidden">목록</span>
          </button>

          <div className="hidden sm:block h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 shrink-0">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight">
                스냅샷 관리
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                <span className="hidden sm:inline">{year}년 </span>W
                {week.toString().padStart(2, "0")}{" "}
                <span className="hidden sm:inline">({weekRange})</span>
              </p>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 - 중앙 정렬 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl w-full px-6">
            {/* 진입점 카드들 - Airbnb 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 데이터 불러오기 - 전체 카드 클릭 가능 */}
              <button
                onClick={() => setMode("loading")}
                className="group relative p-8 bg-white rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden cursor-pointer"
              >
                {/* 배경 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col h-full">
                  {/* 상단: 타이틀 섹션 */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        데이터 불러오기
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        기존 주차 데이터에서 불러오기
                      </p>
                    </div>
                  </div>

                  {/* 하단: 설명 텍스트 */}
                  <div className="mt-auto space-y-1 text-xs text-gray-400">
                    <p>• 이전 주차의 스냅샷 데이터를 복사해서 시작</p>
                    <p>• 동일 프로젝트/모듈 작업 이력 유지</p>
                  </div>
                </div>
              </button>

              {/* 새로 작성하기 */}
              <button
                onClick={handleStartEmpty}
                className="group relative p-8 bg-white rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
              >
                {/* 배경 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col h-full">
                  {/* 상단: 아이콘과 타이틀 */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      새로 작성하기
                    </h2>
                  </div>

                  {/* 하단: 설명 텍스트 */}
                  <div className="mt-auto pt-6 space-y-1.5 text-sm text-gray-500">
                    <p>빈 스냅샷 카드를 생성하여 처음부터 작성</p>
                    <p>편집 화면에서 필요한 정보를 입력</p>
                  </div>
                </div>

                {/* 화살표 */}
                <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg
                    className="w-5 h-5 text-gray-600"
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
                </div>
              </button>
            </div>

            {/* 안내 문구 */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-400">
                작성된 스냅샷은 서버에 저장됩니다 · 편집 후 &quot;신규
                등록하기&quot; 버튼을 눌러주세요
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 불러오기 화면
  if (mode === "loading") {
    // 자동 로딩 중일 때는 로딩 화면 표시
    if (isAutoLoading || isLoadingMyData) {
      return (
        <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-white relative">
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white" />

          {/* 로딩 콘텐츠 */}
          <div className="relative">
            <LogoLoadingSpinner />
          </div>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-white">
        {/* 상단 헤더 */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <button
              onClick={() => {
                navigationProgress.start();
                router.push("/manage/snapshots");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all shrink-0"
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
              <span className="hidden sm:inline">스냅샷 목록으로</span>
              <span className="sm:hidden">목록</span>
            </button>

            <div className="hidden sm:block h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 tracking-tight truncate">
                  데이터 불러오기
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  <span className="hidden sm:inline">{year}년 </span>W
                  {week.toString().padStart(2, "0")}{" "}
                  <span className="hidden sm:inline">({weekRange})</span>
                </p>
              </div>
            </div>
          </div>

          {/* 불러오기 버튼 */}
          <button
            onClick={handleLoadFromWeeks}
            disabled={selectedWeeks.size === 0}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-lg transition-all shrink-0 ${
              selectedWeeks.size > 0
                ? "bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="hidden xs:inline">
              불러오기 ({selectedWeeks.size})
            </span>
            <span className="xs:hidden">({selectedWeeks.size})</span>
          </button>
        </div>

        {/* 메인 콘텐츠 - 2열 레이아웃 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {isLoadingMyData ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : myWeeklyData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-300"
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
                  저장된 스냅샷이 없습니다
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  새로 작성하기로 시작해보세요
                </p>
                <button
                  onClick={() => setMode("entry")}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  돌아가기
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 좌측: 주차 선택 목록 */}
              <div className="w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        주차 선택
                      </h2>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selectedWeeks.size}/{myWeeklyData.length}개 선택됨
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedWeeks.size === myWeeklyData.length) {
                          setSelectedWeeks(new Set());
                        } else {
                          setSelectedWeeks(
                            new Set(myWeeklyData.map((w) => w.key))
                          );
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {selectedWeeks.size === myWeeklyData.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>
                </div>

                {/* 주차 목록 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {myWeeklyData.map((weekData) => {
                    const isSelected = selectedWeeks.has(weekData.key);
                    return (
                      <label
                        key={weekData.key}
                        className={`group flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 group-hover:border-blue-400"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
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
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWeek(weekData.key)}
                          className="sr-only"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {weekData.year}년 {weekData.week}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded">
                              {weekData.entriesCount}개
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {weekData.weekStartDate} ~ {weekData.weekEndDate}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 선택된 주차의 엔트리 카드 목록 */}
              <div className="hidden lg:flex flex-1 overflow-y-auto bg-gray-50">
                {selectedWeeks.size === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">주차를 선택하면</p>
                      <p className="text-xs text-gray-500 mt-1">
                        엔트리 목록이 표시됩니다
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* 선택된 엔트리 수 표시 */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        선택된 엔트리
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                        {Array.from(selectedWeeks).reduce((acc, weekKey) => {
                          const week = myWeeklyData.find(
                            (w) => w.key === weekKey
                          );
                          return acc + (week?.entriesCount || 0);
                        }, 0)}
                        개
                      </span>
                    </div>

                    {/* 엔트리 카드 그리드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {Array.from(selectedWeeks).flatMap((weekKey) => {
                        const weekData = myWeeklyData.find(
                          (w) => w.key === weekKey
                        );
                        if (!weekData) return [];
                        return weekData.entries.map((entry, idx) => (
                          <LoadingEntryCard
                            key={`${weekKey}-${idx}`}
                            entry={entry}
                            weekLabel={`${weekData.year}년 ${weekData.week}`}
                          />
                        ));
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 편집 화면
  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* 상단 툴바 */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 overflow-x-auto">
          <button
            onClick={() => {
              if (changeCount > 0) {
                setShowUnsavedChangesModal(true);
              } else {
                navigationProgress.start();
                router.push("/manage/snapshots");
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all shrink-0"
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
              스냅샷 목록으로
            </span>
            <span className="text-xs font-medium sm:hidden">목록</span>
            {changeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-500 text-white text-[9px] font-bold">
                {changeCount > 99 ? "99+" : changeCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
              <span className="hidden sm:inline">{year}년 </span>W
              {week.toString().padStart(2, "0")}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap hidden sm:inline">
              ({weekRange})
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap">
              신규
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
              {tempSnapshots.length}개 엔트리
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
          {/* 모바일: 카드 리스트 버튼 */}
          <button
            onClick={() => setMobileCardDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
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
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="hidden xs:inline">카드</span>
          </button>

          {/* 모바일: 미리보기 버튼 */}
          <button
            onClick={() => setMobilePreviewDrawerOpen(true)}
            disabled={!selectedSnapshot}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="hidden xs:inline">미리보기</span>
          </button>

          {/* 신규 등록하기 버튼 */}
          <LoadingButton
            onClick={handleSaveClick}
            disabled={isSaving || tempSnapshots.length === 0}
            isLoading={isSaving}
            loadingText="저장 중..."
            variant="primary"
            size="sm"
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
          >
            <span className="hidden sm:inline">신규 등록하기</span>
            <span className="sm:hidden">등록</span>
          </LoadingButton>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: 카드 리스트 */}
        <div
          className="hidden lg:flex border-r border-gray-100 bg-white flex-col shrink-0"
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

        <div className="hidden lg:block">
          <ResizeHandle onResize={handleLeftResize} />
        </div>

        {/* 중앙: 편집 폼 */}
        <div
          className="bg-white overflow-y-auto min-w-0 shrink-0 bg-gradient-to-b from-gray-50 to-white w-full lg:w-auto"
          style={{
            width:
              forceThreeColumn &&
              isMounted &&
              typeof window !== "undefined" &&
              window.innerWidth >= 1024
                ? `calc((100% - ${leftPanelWidth}px - 12px) * ${editPanelRatio})`
                : undefined,
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
            <div className="hidden lg:block">
              <ResizeHandle onResize={handleEditPreviewResize} />
            </div>
            <div className="hidden lg:block overflow-hidden min-w-0 flex-1">
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

      {/* 모바일: 카드 리스트 Drawer */}
      {mobileCardDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileCardDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center py-3 border-b border-gray-200">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                카드 리스트
              </h3>
              <button
                onClick={() => setMobileCardDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <SnapshotCardList
                ref={cardListRef}
                snapshots={tempSnapshots}
                selectedId={selectedId}
                onSelectCard={(id) => {
                  handleSelectCard(id);
                  setMobileCardDrawerOpen(false);
                }}
                onDeleteCard={handleDeleteCard}
                onDuplicateCard={handleDuplicateCard}
                onCopyJson={handleCopyCardJson}
                onCopyPlainText={handleCopyCardPlainText}
                onAddEmpty={handleAddEmpty}
                onCopyAllJson={handleCopyAllJson}
                onCopyAllPlainText={handleCopyAllPlainText}
              />
            </div>
          </div>
        </div>
      )}

      {/* 모바일: 미리보기 Drawer */}
      {mobilePreviewDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobilePreviewDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center py-3 border-b border-gray-200">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">미리보기</h3>
              <button
                onClick={() => setMobilePreviewDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedSnapshot ? (
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
              ) : (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <div>
                    <svg
                      className="w-12 h-12 mx-auto text-gray-300 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      카드를 선택하면 미리보기가 표시됩니다
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workload Level 모달 */}
      <WorkloadLevelModal
        isOpen={showWorkloadModal}
        onClose={() => setShowWorkloadModal(false)}
        onConfirm={handleSaveConfirm}
        year={year}
        week={week}
        initialLevel={workloadLevel}
        initialNote={workloadNote}
        isLoading={isSaving}
        required
        confirmText="신규 등록하기"
      />

      {/* 저장하지 않은 변경사항 확인 모달 */}
      {showUnsavedChangesModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                저장하지 않은 변경사항이 있습니다
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {changeCount}개의 변경사항이 있습니다. 저장하지 않은 정보는 모두
                유지되지 않습니다.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowUnsavedChangesModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedChangesModal(false);
                    navigationProgress.start();
                    router.push("/manage/snapshots");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  저장하지 않고 나가기
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedChangesModal(false);
                    handleSaveClick();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 지난 주 Next 참고 플로팅 버튼 */}
      <LastWeekNextFab
        workspaceId={workspaceId}
        userId={userId}
        year={year}
        week={week}
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

/**
 * 데이터 불러오기 화면용 엔트리 카드 (읽기 전용)
 */
function LoadingEntryCard({
  entry,
  weekLabel,
}: {
  entry: {
    id: string;
    name: string;
    domain: string;
    project: string;
    module: string | null;
    feature: string | null;
    past_week_tasks: PastWeekTask[];
    this_week_tasks: string[];
    risk: string[] | null;
    risk_level: number | null;
    collaborators: Collaborator[];
  };
  weekLabel: string;
}) {
  // 진행률 계산 (past_week_tasks가 undefined일 수 있음)
  const tasks = entry.past_week_tasks || [];
  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
      : null;

  // 리스크 레벨 색상
  const getRiskLevelStyle = (level: number | null) => {
    if (!level || level === 0) return null;
    if (level >= 3)
      return { bg: "bg-red-100", text: "text-red-600", label: "높음" };
    if (level >= 2)
      return { bg: "bg-orange-100", text: "text-orange-600", label: "중간" };
    if (level >= 1)
      return { bg: "bg-yellow-100", text: "text-yellow-600", label: "낮음" };
    return null;
  };

  const riskStyle = getRiskLevelStyle(entry.risk_level);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-3 hover:border-blue-300 hover:shadow-md transition-all">
      {/* 주차 라벨 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-gray-600">
          {weekLabel}
        </span>
        {riskStyle && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              entry.risk_level && entry.risk_level >= 3
                ? "bg-red-500 text-white"
                : entry.risk_level && entry.risk_level >= 2
                ? "bg-orange-500 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            Lv.{entry.risk_level}
          </span>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="space-y-1.5">
        {entry.domain && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 w-10 shrink-0">
              Domain
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 truncate">
              {entry.domain}
            </span>
          </div>
        )}
        {entry.project && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 w-10 shrink-0">
              Project
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 truncate">
              {entry.project}
            </span>
          </div>
        )}
        {entry.module && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 w-10 shrink-0">
              Module
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 truncate">
              {entry.module}
            </span>
          </div>
        )}
        {entry.feature && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 w-10 shrink-0">
              Feature
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 truncate">
              {entry.feature}
            </span>
          </div>
        )}
      </div>

      {/* 진행률 및 태스크 수 */}
      <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avgProgress !== null && (
            <>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    avgProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-600">
                {avgProgress}%
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>{(entry.past_week_tasks || []).length}개 작업</span>
          {(entry.collaborators || []).length > 0 && (
            <span>· {(entry.collaborators || []).length}명 협업</span>
          )}
        </div>
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
