"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection, TreeViewMode } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { DirectoryTree, PersonTree } from "./DirectoryTree";
import { CollaborationNetworkV2 } from "./CollaborationNetworkV2";
import { SnapshotList } from "./SnapshotList";
import { useWorkMapPersistence } from "./persistence";
import { useScrumContext } from "@/context/ScrumContext";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

interface WorkMapViewProps {
  items: ScrumItem[];
}

// 모바일 뷰 상태 타입
type MobileView = "tree" | "detail";

export function WorkMapView({ items }: WorkMapViewProps) {
  // GNB 필터 적용
  const { multiFilters, hasActiveMultiFilters } = useScrumContext();

  // GNB 필터가 적용된 아이템
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        multiFilters.members.length > 0 &&
        !multiFilters.members.includes(item.name)
      )
        return false;
      if (
        multiFilters.domains.length > 0 &&
        !multiFilters.domains.includes(item.domain)
      )
        return false;
      if (
        multiFilters.projects.length > 0 &&
        !multiFilters.projects.includes(item.project)
      )
        return false;
      if (
        multiFilters.modules.length > 0 &&
        (!item.module || !multiFilters.modules.includes(item.module))
      )
        return false;
      if (
        multiFilters.features.length > 0 &&
        !multiFilters.features.includes(item.topic)
      )
        return false;
      return true;
    });
  }, [items, multiFilters]);

  const {
    projects,
    persons,
    getProjectByName,
    getModuleByName,
    getFeatureByName,
    getPersonFeatureItems,
  } = useWorkMapData(filteredItems);

  // 필터 상태 지속성 Hook
  const {
    hideCompleted,
    setHideCompleted,
    viewMode,
    setViewMode,
    expanded,
    toggleProject,
    toggleModule,
    expandProjectPath,
    personExpanded,
    togglePerson,
    toggleDomain,
    togglePersonProject,
    togglePersonModule,
    expandPersonPath,
    selection,
    setSelection,
    personSelection,
    setPersonSelection,
    isInitialized,
  } = useWorkMapPersistence();

  // 옵션 메뉴 상태
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // 옵션 메뉴 외부 클릭 감지
  useEffect(() => {
    if (!isOptionsOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(e.target as Node)
      ) {
        setIsOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOptionsOpen]);

  // 트리 너비 조절 상태 (기본 450px, Tailwind의 w-[450px]에 해당)
  const [treeWidth, setTreeWidth] = useState(450);
  const isResizing = useRef(false);

  // 네트워크 영역 높이 조절 상태 (기본 672px, 최대 960px)
  const [networkHeight, setNetworkHeight] = useState(672);
  const isNetworkResizing = useRef(false);

  // 모바일 관련 상태
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("tree");

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 리사이즈 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = treeWidth;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = e.clientX - startX;
        // 최소 280px, 최대 700px
        const newWidth = Math.max(280, Math.min(700, startWidth + delta));
        setTreeWidth(newWidth);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [treeWidth]
  );

  // 현재 선택된 레벨과 아이템 (프로젝트 뷰)
  const getSelectedItems = (): ScrumItem[] => {
    if (!selection.project) return [];

    // 피쳐 레벨 선택
    if (selection.module && selection.feature) {
      const feature = getFeatureByName(
        selection.project,
        selection.module,
        selection.feature
      );
      return feature?.items || [];
    }

    // 모듈 레벨 선택
    if (selection.module) {
      const module = getModuleByName(selection.project, selection.module);
      return module?.items || [];
    }

    // 프로젝트 레벨 선택
    const project = getProjectByName(selection.project);
    return project?.items || [];
  };

  // 현재 선택된 피쳐 아이템 (사람 뷰)
  const selectedPersonFeatureItems =
    personSelection.person &&
    personSelection.domain &&
    personSelection.project &&
    personSelection.module &&
    personSelection.feature
      ? getPersonFeatureItems(
          personSelection.person,
          personSelection.domain,
          personSelection.project,
          personSelection.module,
          personSelection.feature
        )
      : [];

  // 현재 활성화된 피쳐 아이템 (뷰 모드에 따라)
  const activeFeatureItems =
    viewMode === "project" ? getSelectedItems() : selectedPersonFeatureItems;

  // 선택 레벨 표시용 문자열
  const getSelectionLabel = () => {
    if (!selection.project) return null;
    if (selection.feature)
      return `${selection.project} / ${selection.module} / ${selection.feature}`;
    if (selection.module) return `${selection.project} / ${selection.module}`;
    return selection.project;
  };

  // 피쳐 선택 핸들러 (프로젝트 뷰)
  const handleFeatureSelect = (
    project: string,
    module: string,
    feature: string
  ) => {
    setSelection({ project, module, feature });
    // 모바일에서는 detail 뷰로 전환
    if (isMobile) {
      setMobileView("detail");
    }
  };

  // 프로젝트 보기 핸들러
  const handleProjectView = (project: string) => {
    setSelection({ project, module: null, feature: null });
    if (isMobile) {
      setMobileView("detail");
    }
  };

  // 모듈 보기 핸들러
  const handleModuleView = (project: string, module: string) => {
    setSelection({ project, module, feature: null });
    if (isMobile) {
      setMobileView("detail");
    }
  };

  // 피쳐 선택 핸들러 (사람 뷰)
  const handlePersonFeatureSelect = (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => {
    setPersonSelection({ person, domain, project, module, feature });
    // 모바일에서는 detail 뷰로 전환
    if (isMobile) {
      setMobileView("detail");
    }
  };

  // 모바일에서 트리 뷰로 돌아가기
  const handleBackToTree = () => {
    setMobileView("tree");
  };

  // 선택된 피쳐의 협업자 존재 여부
  const hasCollaborators = activeFeatureItems.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );

  // 뷰 모드 토글
  const toggleViewMode = () => {
    setViewMode(viewMode === "project" ? "person" : "project");
  };

  // 초기화 전 로딩 상태 표시
  if (!isInitialized) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 120px)", minHeight: "600px" }}
      >
        <LogoLoadingSpinner title="Work Map을 불러오는 중" />
      </div>
    );
  }

  // 모바일 뷰 렌더링
  if (isMobile) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ minHeight: "calc(100vh - 120px)" }}
      >
        {mobileView === "tree" ? (
          // 모바일: 트리 뷰 (전체 화면)
          <div className="flex-1 flex flex-col">
            {/* 트리 헤더 */}
            <div
              className="flex-shrink-0 px-4 py-3 border-b"
              style={{
                borderColor: "#d0d7de",
                background: "white",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span
                    className="font-semibold"
                    style={{ color: "#24292f" }}
                  >
                    Work Map
                  </span>
                  {hasActiveMultiFilters && (
                    <span
                      className="px-1 py-0.5 rounded text-[9px] font-medium"
                      style={{
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                      }}
                    >
                      필터
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* 뷰 모드 토글 */}
                  <button
                    onClick={toggleViewMode}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background:
                        viewMode === "person"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "var(--gnb-filter-bg)",
                      color:
                        viewMode === "person"
                          ? "#3b82f6"
                          : "#57606a",
                    }}
                  >
                    {viewMode === "project" ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </button>

                  {/* 옵션 버튼 */}
                  <button
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                    style={{
                      background: isOptionsOpen
                        ? "var(--gnb-filter-bg)"
                        : "transparent",
                      color: "#57606a",
                    }}
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
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "#57606a" }}
              >
                {viewMode === "project"
                  ? `${projects.length} projects · ${filteredItems.length} snapshots`
                  : `${persons.length} members · ${filteredItems.length} snapshots`}
              </div>

              {/* 모바일 옵션 드롭다운 */}
              {isOptionsOpen && (
                <div
                  className="absolute right-3 top-14 w-44 rounded-lg overflow-hidden z-50 animate-fadeIn"
                  style={{
                    background: "white",
                    boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
                    border: "1px solid #d0d7de",
                  }}
                >
                  <div className="p-2">
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideCompleted}
                        onChange={(e) => {
                          setHideCompleted(e.target.checked);
                          setIsOptionsOpen(false);
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span
                        className="text-xs"
                        style={{ color: "#24292f" }}
                      >
                        완료 항목 숨김
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 트리 컨텐츠 - 전체 화면 (스크롤 가능) */}
            <div
              className="flex-1 overflow-y-auto p-3"
              style={{ background: "white" }}
            >
              {viewMode === "project" ? (
                <DirectoryTree
                  projects={projects}
                  selectedFeature={selection}
                  onFeatureSelect={handleFeatureSelect}
                  onProjectView={handleProjectView}
                  onModuleView={handleModuleView}
                  hideCompleted={hideCompleted}
                  expanded={expanded}
                  onToggleProject={toggleProject}
                  onToggleModule={toggleModule}
                  onExpandPath={expandProjectPath}
                />
              ) : (
                <PersonTree
                  persons={persons}
                  selectedFeature={personSelection}
                  onFeatureSelect={handlePersonFeatureSelect}
                  hideCompleted={hideCompleted}
                  expanded={personExpanded}
                  onTogglePerson={togglePerson}
                  onToggleDomain={toggleDomain}
                  onToggleProject={togglePersonProject}
                  onToggleModule={togglePersonModule}
                  onExpandPath={expandPersonPath}
                />
              )}
            </div>
          </div>
        ) : (
          // 모바일: 상세 뷰
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 헤더 + 뒤로가기 */}
            <div
              className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-3"
              style={{
                borderColor: "#d0d7de",
                background: "white",
              }}
            >
              <button
                onClick={handleBackToTree}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{ background: "#f6f8fa" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "#24292f" }}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: "#24292f" }}
                >
                  {viewMode === "project"
                    ? selection.feature
                    : personSelection.feature}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "#57606a" }}
                >
                  {viewMode === "project"
                    ? `${selection.project} / ${selection.module}`
                    : `${personSelection.person} / ${personSelection.domain}`}
                </div>
              </div>
            </div>

            {/* 상세 내용 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {activeFeatureItems.length > 0 ? (
                <>
                  {/* 협업 네트워크 (모바일) */}
                  {hasCollaborators && (
                    <div
                      className="rounded-md"
                      style={{
                        background: "white",
                        border: "1px solid #d0d7de",
                        height: "300px",
                      }}
                    >
                      <div
                        className="px-4 py-2 border-b"
                        style={{ borderColor: "#d0d7de" }}
                      >
                        <h2
                          className="font-semibold text-sm"
                          style={{ color: "#24292f" }}
                        >
                          Collaboration Network
                        </h2>
                      </div>
                      <div className="p-2 h-[calc(100%-40px)]">
                        <CollaborationNetworkV2
                          items={activeFeatureItems}
                          allItems={filteredItems}
                          featureName={
                            viewMode === "project"
                              ? selection.feature || undefined
                              : personSelection.feature || undefined
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* 스냅샷 목록 */}
                  <SnapshotList items={activeFeatureItems} />
                </>
              ) : (
                <div
                  className="flex-1 rounded-md flex flex-col items-center justify-center py-12"
                  style={{
                    background: "white",
                    border: "1px solid #d0d7de",
                  }}
                >
                  <div
                    className="text-4xl mb-3 p-4 rounded-full"
                    style={{ background: "#f6f8fa" }}
                  >
                    📄
                  </div>
                  <div
                    className="text-base font-medium mb-1"
                    style={{ color: "#24292f" }}
                  >
                    데이터 없음
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 데스크톱 뷰 렌더링
  return (
    <div
      className="flex gap-1"
      style={{ height: "calc(100vh - 120px)", minHeight: "600px" }}
    >
      {/* 좌측: 디렉토리 트리 */}
      <div
        className="flex-shrink-0 rounded-md overflow-hidden flex flex-col animate-slide-in-left interactive-card"
        style={{
          width: treeWidth,
          background: "white",
          border: "1px solid #d0d7de",
        }}
      >
        {/* 트리 헤더 */}
        <div
          className="flex-shrink-0 px-4 py-3 border-b"
          style={{ borderColor: "#d0d7de" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span
                className="font-semibold"
                style={{ color: "#24292f" }}
              >
                Work Map
              </span>
              {hasActiveMultiFilters && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#3b82f6",
                  }}
                >
                  필터 적용됨
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 뷰 모드 토글 (스위치 형태) */}
              <div
                className="flex items-center p-0.5 rounded-lg"
                style={{ background: "var(--gnb-filter-bg)" }}
              >
                <button
                  onClick={() => setViewMode("project")}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background:
                      viewMode === "project"
                        ? "rgba(59, 130, 246, 0.15)"
                        : "transparent",
                    color:
                      viewMode === "project"
                        ? "#3b82f6"
                        : "#57606a",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Project</span>
                </button>
                <button
                  onClick={() => setViewMode("person")}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background:
                      viewMode === "person"
                        ? "rgba(59, 130, 246, 0.15)"
                        : "transparent",
                    color:
                      viewMode === "person"
                        ? "#3b82f6"
                        : "#57606a",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Person</span>
                </button>
              </div>

              {/* 옵션 메뉴 */}
              <div className="relative" ref={optionsRef}>
                <button
                  onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
                  style={{
                    background: isOptionsOpen
                      ? "var(--gnb-filter-bg)"
                      : "transparent",
                    color: "#57606a",
                  }}
                  title="옵션"
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* 옵션 드롭다운 */}
                {isOptionsOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg overflow-hidden z-50 animate-fadeIn"
                    style={{
                      background: "white",
                      boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
                      border: "1px solid #d0d7de",
                    }}
                  >
                    <div className="p-2">
                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={hideCompleted}
                          onChange={(e) => setHideCompleted(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span
                          className="text-xs"
                          style={{ color: "#24292f" }}
                        >
                          완료 항목 숨김
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "#57606a" }}
          >
            {viewMode === "project"
              ? `${projects.length} projects · ${filteredItems.length} snapshots`
              : `${persons.length} members · ${filteredItems.length} snapshots`}
          </div>
        </div>

        {/* 트리 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-3">
          {viewMode === "project" ? (
            <DirectoryTree
              projects={projects}
              selectedFeature={selection}
              onFeatureSelect={handleFeatureSelect}
              onProjectView={handleProjectView}
              onModuleView={handleModuleView}
              hideCompleted={hideCompleted}
              expanded={expanded}
              onToggleProject={toggleProject}
              onToggleModule={toggleModule}
              onExpandPath={expandProjectPath}
            />
          ) : (
            <PersonTree
              persons={persons}
              selectedFeature={personSelection}
              onFeatureSelect={handlePersonFeatureSelect}
              hideCompleted={hideCompleted}
              expanded={personExpanded}
              onTogglePerson={togglePerson}
              onToggleDomain={toggleDomain}
              onToggleProject={togglePersonProject}
              onToggleModule={togglePersonModule}
              onExpandPath={expandPersonPath}
            />
          )}
        </div>
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="w-1 flex-shrink-0 cursor-col-resize group relative"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div
            className="w-1 h-8 rounded-full transition-colors group-hover:bg-blue-400"
            style={{ background: "#d0d7de" }}
          />
        </div>
      </div>

      {/* 우측: 협업 네트워크 + 스냅샷 */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 ml-3 animate-slide-in-right">
        {/* 선택된 정보 헤더 */}
        {activeFeatureItems.length > 0 && (
          <div
            className="flex-shrink-0 px-5 py-4 rounded-md interactive-card animate-card-reveal"
            style={{
              background: "white",
              border: "1px solid #d0d7de",
            }}
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "#57606a" }}
            >
              {viewMode === "project" ? (
                <>
                  <button
                    onClick={() => handleProjectView(selection.project!)}
                    className={`hover:underline transition-colors ${
                      !selection.module
                        ? "font-semibold cursor-default"
                        : "cursor-pointer"
                    }`}
                    style={{
                      color: !selection.module
                        ? "#24292f"
                        : undefined,
                    }}
                    disabled={!selection.module}
                  >
                    {selection.project}
                  </button>
                  {selection.module && (
                    <>
                      <span>/</span>
                      <button
                        onClick={() =>
                          handleModuleView(
                            selection.project!,
                            selection.module!
                          )
                        }
                        className={`hover:underline transition-colors ${
                          !selection.feature
                            ? "font-semibold cursor-default"
                            : "cursor-pointer"
                        }`}
                        style={{
                          color: !selection.feature
                            ? "#24292f"
                            : undefined,
                        }}
                        disabled={!selection.feature}
                      >
                        {selection.module}
                      </button>
                    </>
                  )}
                  {selection.feature && (
                    <>
                      <span>/</span>
                      <span
                        className="font-semibold"
                        style={{ color: "#24292f" }}
                      >
                        {selection.feature}
                      </span>
                    </>
                  )}
                  {/* 레벨 표시 */}
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "#f6f8fa" }}
                  >
                    {selection.feature
                      ? "Feature"
                      : selection.module
                      ? "Module"
                      : "Project"}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="font-semibold"
                    style={{ color: "#0969da" }}
                  >
                    {personSelection.person}
                  </span>
                  <span>/</span>
                  <span>{personSelection.domain}</span>
                  <span>/</span>
                  <span>{personSelection.project}</span>
                  <span>/</span>
                  <span>{personSelection.module}</span>
                  <span>/</span>
                  <span
                    className="font-semibold"
                    style={{ color: "#24292f" }}
                  >
                    {personSelection.feature}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {activeFeatureItems.length > 0 ? (
          <div className="pb-6">
            {/* 협업 네트워크 */}
            {hasCollaborators && (
              <div className="flex-shrink-0 flex flex-col">
                <div
                  className="rounded-md overflow-hidden"
                  style={{
                    background: "white",
                    border: "1px solid #d0d7de",
                    height: networkHeight,
                  }}
                >
                  <div
                    className="px-5 py-4 border-b"
                    style={{ borderColor: "#d0d7de" }}
                  >
                    <h2
                      className="font-semibold text-sm"
                      style={{ color: "#24292f" }}
                    >
                      Collaboration Network
                    </h2>
                  </div>
                  <div className="p-4 h-[calc(100%-48px)]">
                    <CollaborationNetworkV2
                      items={activeFeatureItems}
                      allItems={filteredItems}
                      featureName={
                        viewMode === "project"
                          ? selection.feature || undefined
                          : personSelection.feature || undefined
                      }
                    />
                  </div>
                </div>
                {/* 네트워크 높이 조절 핸들 */}
                <div
                  className="h-4 flex-shrink-0 cursor-row-resize group flex items-center justify-center"
                  onMouseDown={(e) => {
                    isNetworkResizing.current = true;
                    e.preventDefault();

                    const startY = e.clientY;
                    const startHeight = networkHeight;

                    const handleMouseMove = (moveE: MouseEvent) => {
                      if (!isNetworkResizing.current) return;
                      const delta = moveE.clientY - startY;
                      const newHeight = Math.max(
                        250,
                        Math.min(960, startHeight + delta)
                      );
                      setNetworkHeight(newHeight);
                    };

                    const handleMouseUp = () => {
                      isNetworkResizing.current = false;
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  <div
                    className="w-12 h-1 rounded-full transition-colors group-hover:bg-blue-400"
                    style={{ background: "#d0d7de" }}
                  />
                </div>
              </div>
            )}

            {/* 스냅샷 목록 */}
            <div className="flex-1" style={{ minHeight: "200px" }}>
              <SnapshotList items={activeFeatureItems} />
            </div>
          </div>
        ) : (
          /* 빈 상태 */
          <div
            className="flex-1 rounded-md flex flex-col items-center justify-center"
            style={{
              background: "white",
              border: "1px solid #d0d7de",
            }}
          >
            <div
              className="text-6xl mb-4 p-6 rounded-full"
              style={{ background: "#f6f8fa" }}
            >
              📄
            </div>
            <div
              className="text-lg font-medium mb-2"
              style={{ color: "#24292f" }}
            >
              피쳐를 선택하세요
            </div>
            <div
              className="text-sm text-center"
              style={{ color: "#57606a" }}
            >
              좌측 트리에서 피쳐를 선택하면
              <br />
              협업 네트워크와 스냅샷 정보가 표시됩니다
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
