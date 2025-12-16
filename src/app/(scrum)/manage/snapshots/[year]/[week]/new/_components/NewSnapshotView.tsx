"use client";

/**
 * 새로 작성하기 화면
 *
 * 시작 옵션:
 * 1. 데이터 불러오기 (기존 주차별 데이터에서 불러오기)
 * 2. 새로 작성하기 (빈 상태에서 시작)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatWeekRange } from "@/lib/date/isoWeek";
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
  createEmptySnapshot,
  tempSnapshotToV2Json,
  tempSnapshotToPlainText,
  convertToTempSnapshot,
} from "@/components/weekly-scrum/manage/types";
import { createSnapshotAndEntries } from "../../../../_actions";
import type { SnapshotEntryPayload } from "../../../../_actions";
import type { PastWeekTask, Collaborator } from "@/lib/supabase/types";

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
      const emptySnapshot = createEmptySnapshot();
      emptySnapshot.name = displayName;
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

  // 데이터 불러오기 상태
  const [myWeeklyData, setMyWeeklyData] = useState<WeekData[]>([]);
  const [isLoadingMyData, setIsLoadingMyData] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());

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

  // 새로 작성하기 (빈 상태로 시작)
  const handleStartEmpty = () => {
    const newSnapshot = createEmptySnapshot();
    // 현재 로그인한 사용자의 이름을 기본값으로 설정
    newSnapshot.name = displayName;
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
  const handleDuplicateCard = useCallback((tempId: string) => {
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
  }, [displayName]);

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
    const newSnapshot = createEmptySnapshot();
    // 현재 로그인한 사용자의 이름을 기본값으로 설정
    newSnapshot.name = displayName;
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
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
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
              스냅샷 목록으로
            </button>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25">
                <svg
                  className="w-5 h-5 text-white"
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
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  스냅샷 관리
                </h1>
                <p className="text-sm text-gray-500">
                  {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
                </p>
              </div>
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
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* 상단 헤더 */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode("entry")}
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
              뒤로가기
            </button>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <svg
                  className="w-5 h-5 text-white"
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
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  데이터 불러오기
                </h1>
                <p className="text-sm text-gray-500">
                  {year}년 W{week.toString().padStart(2, "0")} ({weekRange})
                </p>
              </div>
            </div>
          </div>

          {/* 불러오기 버튼 */}
          <button
            onClick={handleLoadFromWeeks}
            disabled={selectedWeeks.size === 0}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              selectedWeeks.size > 0
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            불러오기 ({selectedWeeks.size})
          </button>
        </div>

        {/* 메인 콘텐츠 - 2열 레이아웃 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {isLoadingMyData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : myWeeklyData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">저장된 스냅샷이 없습니다</h3>
                <p className="text-sm text-gray-500 mb-6">새로 작성하기로 시작해보세요</p>
                <button
                  onClick={() => setMode("entry")}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 좌측: 주차 선택 목록 */}
              <div className="w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col shrink-0">
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-gray-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">주차 선택</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedWeeks.size}/{myWeeklyData.length}개 선택됨
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedWeeks.size === myWeeklyData.length) {
                          setSelectedWeeks(new Set());
                        } else {
                          setSelectedWeeks(new Set(myWeeklyData.map((w) => w.key)));
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {selectedWeeks.size === myWeeklyData.length ? "전체 해제" : "전체 선택"}
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
                        className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                              {weekData.entriesCount}개
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {weekData.weekStartDate} ~ {weekData.weekEndDate}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 선택된 주차의 엔트리 카드 목록 */}
              <div className="flex-1 overflow-y-auto bg-gray-50/30">
                {selectedWeeks.size === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">주차를 선택하면</p>
                      <p className="text-xs text-gray-400 mt-1">엔트리 목록이 표시됩니다</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* 선택된 엔트리 수 표시 */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        선택된 엔트리
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {Array.from(selectedWeeks).reduce((acc, weekKey) => {
                          const week = myWeeklyData.find(w => w.key === weekKey);
                          return acc + (week?.entriesCount || 0);
                        }, 0)}개
                      </span>
                    </div>

                    {/* 엔트리 카드 그리드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {Array.from(selectedWeeks).flatMap((weekKey) => {
                        const weekData = myWeeklyData.find(w => w.key === weekKey);
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
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              navigationProgress.start();
              router.push("/manage/snapshots");
            }}
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
            <span className="text-xs font-medium">스냅샷 목록으로</span>
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
          {/* 신규 등록하기 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving || tempSnapshots.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                저장 중...
              </>
            ) : (
              <>
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
      ? Math.round(
          tasks.reduce((sum, t) => sum + t.progress, 0) /
            tasks.length
        )
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
    <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-shadow">
      {/* 주차 라벨 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-gray-400">{weekLabel}</span>
        {riskStyle && (
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${riskStyle.bg} ${riskStyle.text}`}>
            Lv.{entry.risk_level}
          </span>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="space-y-1.5">
        {entry.domain && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 w-10 shrink-0">Domain</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate">
              {entry.domain}
            </span>
          </div>
        )}
        {entry.project && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 w-10 shrink-0">Project</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate">
              {entry.project}
            </span>
          </div>
        )}
        {entry.module && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 w-10 shrink-0">Module</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate">
              {entry.module}
            </span>
          </div>
        )}
        {entry.feature && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 w-10 shrink-0">Feature</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate">
              {entry.feature}
            </span>
          </div>
        )}
      </div>

      {/* 진행률 및 태스크 수 */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avgProgress !== null && (
            <>
              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${avgProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{avgProgress}%</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{entry.past_week_tasks.length}개 작업</span>
          {entry.collaborators.length > 0 && (
            <span>· {entry.collaborators.length}명 협업</span>
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
