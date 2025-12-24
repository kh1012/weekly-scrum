"use client";

/**
 * 스냅샷 관리 메인 뷰
 *
 * - 좌측/상단: 연도 + ISO 주차 선택 UI
 * - 중앙: 스냅샷 목록 (Pinterest/리스트 토글)
 * - 우측: 주차 메타데이터 요약 (접힘/더보기)
 * - 우측 상단: 편집하기 / 새로 작성하기 버튼
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WeekSelector } from "./WeekSelector";
import { SnapshotList } from "./SnapshotList";
import { WeekMetaPanel } from "./WeekMetaPanel";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LoadingButton } from "@/components/common/LoadingButton";
import { getCurrentISOWeek, getWeekStartDateString } from "@/lib/date/isoWeek";
import { NewSnapshotModal } from "@/components/weekly-scrum/manage/NewSnapshotModal";
import { ToastProvider } from "@/components/weekly-scrum/manage/Toast";
import type { WorkloadLevel } from "@/lib/supabase/types";

interface SnapshotsMainViewProps {
  userId: string;
  workspaceId: string;
}

interface PastWeekTask {
  title: string;
  progress: number;
}

interface PastWeekData {
  tasks?: PastWeekTask[];
}

interface ThisWeekData {
  tasks?: string[];
}

interface Collaborator {
  name: string;
  relation?: "pair" | "pre" | "post";
  relations?: ("pair" | "pre" | "post")[];
}

export interface SnapshotSummary {
  id: string;
  created_at: string;
  updated_at: string;
  workload_level?: WorkloadLevel | null;
  workload_note?: string | null;
  entriesCount: number;
  entries: {
    id: string;
    domain: string;
    project: string;
    module: string | null;
    feature: string | null;
    past_week?: PastWeekData;
    this_week?: ThisWeekData;
    risks?: string[];
    risk_level?: number;
    collaborators?: Collaborator[];
  }[];
}

export interface WeekStatsData {
  projectCount: number;
  moduleCount: number;
  featureCount: number;
  avgProgress: number | null;
  domainDistribution: Record<string, number>;
  totalEntries: number;
}

// localStorage 키
const SNAPSHOTS_STATE_KEY = "snapshots-main-view-state";

interface SnapshotsViewState {
  selectedYear: number;
  selectedWeek: number;
  viewMode: "grid" | "list";
}

function SnapshotsMainViewInner({
  userId,
  workspaceId,
}: SnapshotsMainViewProps) {
  const router = useRouter();
  const currentWeek = getCurrentISOWeek();

  // localStorage에서 상태 복원
  const [isStateInitialized, setIsStateInitialized] = useState(false);

  // 주차 선택 상태
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);

  // 뷰 모드
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 전체 펼치기/접기 상태
  const [allExpanded, setAllExpanded] = useState(false);

  // 선택 모드 상태
  const [isSelectMode, setIsSelectMode] = useState(false);

  // localStorage에서 상태 복원
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SNAPSHOTS_STATE_KEY);
      if (savedState) {
        const parsed: SnapshotsViewState = JSON.parse(savedState);
        if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
        if (parsed.selectedWeek) setSelectedWeek(parsed.selectedWeek);
        if (parsed.viewMode) setViewMode(parsed.viewMode);
      }
    } catch {
      // 무시
    }
    setIsStateInitialized(true);
  }, []);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isStateInitialized) return;
    try {
      const stateToSave: SnapshotsViewState = {
        selectedYear,
        selectedWeek,
        viewMode,
      };
      localStorage.setItem(SNAPSHOTS_STATE_KEY, JSON.stringify(stateToSave));
    } catch {
      // 무시
    }
  }, [selectedYear, selectedWeek, viewMode, isStateInitialized]);

  // 스냅샷 목록
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태

  // 주차별 스냅샷 갯수 맵 (key: "년도-주차", value: 갯수)
  const [snapshotCountByWeek, setSnapshotCountByWeek] = useState<
    Map<string, number>
  >(new Map());

  // 메타데이터
  const [weekStats, setWeekStats] = useState<WeekStatsData | null>(null);
  const [isMetaPanelExpanded, setIsMetaPanelExpanded] = useState(false);

  // 필터 상태 (다중 선택)
  const [projectFilters, setProjectFilters] = useState<Set<string>>(new Set());
  const [moduleFilters, setModuleFilters] = useState<Set<string>>(new Set());
  const [featureFilters, setFeatureFilters] = useState<Set<string>>(new Set());

  // 필터 드롭다운 상태
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isModuleFilterOpen, setIsModuleFilterOpen] = useState(false);
  const [isFeatureFilterOpen, setIsFeatureFilterOpen] = useState(false);

  // 필터 토글 함수
  const toggleProjectFilter = (project: string) => {
    setProjectFilters((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  };
  const toggleModuleFilter = (module: string) => {
    setModuleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };
  const toggleFeatureFilter = (feature: string) => {
    setFeatureFilters((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  };

  // 필터 옵션 추출
  const filterOptions = useMemo(() => {
    const projects = new Set<string>();
    const modules = new Set<string>();
    const features = new Set<string>();

    snapshots.forEach((s) => {
      s.entries.forEach((e) => {
        if (e.project) projects.add(e.project);
        if (e.module) modules.add(e.module);
        if (e.feature) features.add(e.feature);
      });
    });

    return {
      projects: Array.from(projects).sort(),
      modules: Array.from(modules).sort(),
      features: Array.from(features).sort(),
    };
  }, [snapshots]);

  // 필터링된 스냅샷
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      const matchesProject =
        projectFilters.size === 0 ||
        s.entries.some((e) => projectFilters.has(e.project));
      const matchesModule =
        moduleFilters.size === 0 ||
        s.entries.some((e) => e.module && moduleFilters.has(e.module));
      const matchesFeature =
        featureFilters.size === 0 ||
        s.entries.some((e) => e.feature && featureFilters.has(e.feature));
      return matchesProject && matchesModule && matchesFeature;
    });
  }, [snapshots, projectFilters, moduleFilters, featureFilters]);

  // 필터 초기화
  const clearFilters = () => {
    setProjectFilters(new Set());
    setModuleFilters(new Set());
    setFeatureFilters(new Set());
  };

  const totalFilterCount =
    projectFilters.size + moduleFilters.size + featureFilters.size;
  const hasActiveFilters = totalFilterCount > 0;

  // 초기 마운트 시 프로그래스바 완료 (이미 로드된 상태이므로)
  useEffect(() => {
    navigationProgress.done();
  }, []);

  // 스냅샷 목록 조회
  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    navigationProgress.start(); // 프로그레스바 시작
    try {
      const weekStartDate = getWeekStartDateString(selectedYear, selectedWeek);
      const response = await fetch(
        `/api/manage/snapshots?workspaceId=${workspaceId}&userId=${userId}&weekStartDate=${weekStartDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
        setWeekStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
    } finally {
      setIsLoading(false);
      navigationProgress.done(); // 프로그레스바 완료
    }
  }, [selectedYear, selectedWeek, workspaceId, userId]);

  // localStorage 상태 복원이 완료된 후에만 fetch
  useEffect(() => {
    if (!isStateInitialized) return;
    fetchSnapshots();
  }, [fetchSnapshots, isStateInitialized]);

  // 주차별 스냅샷 갯수 조회
  const fetchSnapshotCounts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/manage/snapshots/counts?workspaceId=${workspaceId}&userId=${userId}&year=${selectedYear}`
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
  }, [selectedYear, workspaceId, userId]);

  // localStorage 상태 복원이 완료된 후에만 fetch
  useEffect(() => {
    if (!isStateInitialized) return;
    fetchSnapshotCounts();
  }, [fetchSnapshotCounts, isStateInitialized]);

  // 편집하기
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);
  const handleEditWeek = () => {
    setIsNavigatingToEdit(true);
    navigationProgress.start();
    router.push(`/manage/snapshots/${selectedYear}/${selectedWeek}/edit`);
  };

  // 새로 작성하기 모달 상태
  const [isNewSnapshotModalOpen, setIsNewSnapshotModalOpen] = useState(false);

  // 기존 데이터 불러오기 선택
  const handleLoadExistingData = () => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    router.push(
      `/manage/snapshots/${selectedYear}/${selectedWeek}/new?mode=load`
    );
  };

  // 빈 스냅샷 생성 선택
  const handleCreateEmpty = () => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    router.push(
      `/manage/snapshots/${selectedYear}/${selectedWeek}/new?mode=empty`
    );
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
      {/* 헤더 영역 - 글래스모피즘 */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 좌측: 타이틀 */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                스냅샷 관리
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                주차별 스냅샷 조회 및 관리
              </p>
            </div>
          </div>

          {/* 우측: 필터 + 액션 버튼 */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* 필터 드롭다운 (체크박스 형태) - 모바일에서는 숨김 */}
            <div className="hidden md:flex items-center gap-2">
              {/* 필터 초기화 (Reset) 버튼 - 항상 표시, 필터 없으면 비활성화 */}
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                    : "text-gray-300 bg-gray-50 cursor-not-allowed"
                }`}
                title="필터 초기화"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </button>

              <div className="w-px h-4 bg-gray-200" />

              {/* 프로젝트 필터 */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProjectFilterOpen(!isProjectFilterOpen);
                    setIsModuleFilterOpen(false);
                    setIsFeatureFilterOpen(false);
                  }}
                  className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                    projectFilters.size > 0
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>Project</span>
                  {projectFilters.size > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {projectFilters.size}
                    </span>
                  )}
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      isProjectFilterOpen ? "rotate-180" : ""
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
                {isProjectFilterOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto min-w-[180px]">
                    {filterOptions.projects.map((p) => (
                      <label
                        key={p}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={projectFilters.has(p)}
                          onChange={() => toggleProjectFilter(p)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={
                            projectFilters.has(p)
                              ? "font-medium text-blue-600"
                              : "text-gray-700"
                          }
                        >
                          {p}
                        </span>
                      </label>
                    ))}
                    {filterOptions.projects.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        항목 없음
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 모듈 필터 */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsModuleFilterOpen(!isModuleFilterOpen);
                    setIsProjectFilterOpen(false);
                    setIsFeatureFilterOpen(false);
                  }}
                  className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                    moduleFilters.size > 0
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>Module</span>
                  {moduleFilters.size > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {moduleFilters.size}
                    </span>
                  )}
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      isModuleFilterOpen ? "rotate-180" : ""
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
                {isModuleFilterOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto min-w-[180px]">
                    {filterOptions.modules.map((m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={moduleFilters.has(m)}
                          onChange={() => toggleModuleFilter(m)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={
                            moduleFilters.has(m)
                              ? "font-medium text-emerald-600"
                              : "text-gray-700"
                          }
                        >
                          {m}
                        </span>
                      </label>
                    ))}
                    {filterOptions.modules.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        항목 없음
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 기능 필터 */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsFeatureFilterOpen(!isFeatureFilterOpen);
                    setIsProjectFilterOpen(false);
                    setIsModuleFilterOpen(false);
                  }}
                  className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                    featureFilters.size > 0
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>Feature</span>
                  {featureFilters.size > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {featureFilters.size}
                    </span>
                  )}
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      isFeatureFilterOpen ? "rotate-180" : ""
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
                {isFeatureFilterOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto min-w-[180px]">
                    {filterOptions.features.map((f) => (
                      <label
                        key={f}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={featureFilters.has(f)}
                          onChange={() => toggleFeatureFilter(f)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span
                          className={
                            featureFilters.has(f)
                              ? "font-medium text-amber-600"
                              : "text-gray-700"
                          }
                        >
                          {f}
                        </span>
                      </label>
                    ))}
                    {filterOptions.features.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        항목 없음
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block h-6 w-px bg-gray-200" />

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2 md:gap-3">
              <LoadingButton
                onClick={handleEditWeek}
                disabled={snapshots.length === 0}
                isLoading={isNavigatingToEdit}
                loadingText="이동 중..."
                variant="secondary"
                size="md"
                icon={
                  <svg
                    className="w-4 h-4 group-hover:rotate-12 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
                className="group flex-1 md:flex-none text-blue-600 bg-blue-50 border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-100"
                gradient={false}
              >
                <span className="hidden sm:inline">편집하기</span>
                <span className="sm:hidden">편집</span>
              </LoadingButton>

              <LoadingButton
                onClick={() => setIsNewSnapshotModalOpen(true)}
                disabled={snapshots.length > 0}
                variant="primary"
                size="md"
                icon={
                  <svg
                    className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
                className="group flex-1 md:flex-none"
                title={
                  snapshots.length > 0
                    ? "이미 스냅샷이 존재합니다. '편집하기' 버튼을 사용하세요."
                    : ""
                }
              >
                <span className="hidden sm:inline">새로 작성하기</span>
                <span className="sm:hidden">작성</span>
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* 서브 메뉴 영역 - 글래스 효과 + z-index 설정 */}
        <div className="shrink-0 relative z-40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 px-4 md:px-6 py-3 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-gray-100">
          {/* 좌측: WeekSelector */}
          <WeekSelector
            year={selectedYear}
            week={selectedWeek}
            onYearChange={setSelectedYear}
            onWeekChange={setSelectedWeek}
            snapshotCount={snapshots.length}
            snapshotCountByWeek={snapshotCountByWeek}
            workloadLevel={
              snapshots.length > 0 ? snapshots[0].workload_level : null
            }
          />

          {/* 우측: 뷰 모드 토글 + 전체 펼치기 */}
          <div className="flex items-center gap-3">
            {/* 뷰 모드 토글 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="그리드 뷰"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="리스트 뷰"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* 전체 펼치기/접기 버튼 - 토글 버튼과 높이 맞춤 */}
            {filteredSnapshots.length > 0 && (
              <button
                onClick={() => setAllExpanded(!allExpanded)}
                className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                  allExpanded
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${
                    allExpanded ? "rotate-180" : ""
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
                {allExpanded ? "전체 접기" : "전체 펼치기"}
              </button>
            )}

            {/* 선택 모드 토글 버튼 */}
            {snapshots.length > 0 && (
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-colors ${
                  isSelectMode
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {isSelectMode ? "완료" : "선택"}
              </button>
            )}
          </div>
        </div>

        {/* 스냅샷 목록 영역 - Bottom Sheet를 위한 relative 컨테이너 */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* 스냅샷 목록 */}
          <div className="h-full overflow-y-auto p-4 md:p-6 pb-24 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
            <SnapshotList
              snapshots={filteredSnapshots}
              isLoading={isLoading}
              viewMode={viewMode}
              onRefresh={fetchSnapshots}
              year={selectedYear}
              week={selectedWeek}
              allExpanded={allExpanded}
              onEntryDeleted={fetchSnapshots}
              isSelectMode={isSelectMode}
              onToggleSelectMode={setIsSelectMode}
            />
          </div>

          {/* 메타데이터 패널 - Bottom Sheet 스타일 (모바일에서 숨김) */}
          <div className="hidden md:block">
            <WeekMetaPanel
              stats={weekStats}
              isExpanded={isMetaPanelExpanded}
              onToggle={() => setIsMetaPanelExpanded(!isMetaPanelExpanded)}
              snapshotCount={snapshots.length}
            />
          </div>
        </div>
      </div>

      {/* 새로 작성하기 모달 */}
      <NewSnapshotModal
        isOpen={isNewSnapshotModalOpen}
        onClose={() => setIsNewSnapshotModalOpen(false)}
        year={selectedYear}
        week={selectedWeek}
        onLoadExistingData={handleLoadExistingData}
        onCreateEmpty={handleCreateEmpty}
      />
    </div>
  );
}

export function SnapshotsMainView(props: SnapshotsMainViewProps) {
  return (
    <ToastProvider>
      <SnapshotsMainViewInner {...props} />
    </ToastProvider>
  );
}
