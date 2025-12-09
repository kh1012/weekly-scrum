"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection, TreeViewMode } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { DirectoryTree, PersonTree } from "./DirectoryTree";
import { CollaborationNetworkV2 } from "./CollaborationNetworkV2";
import { SnapshotList } from "./SnapshotList";
import { useWorkMapPersistence } from "./persistence";

interface WorkMapViewProps {
  items: ScrumItem[];
}

// 사람 뷰 선택 상태 타입
interface PersonSelection {
  person: string | null;
  domain: string | null;
  project: string | null;
  module: string | null;
  feature: string | null;
}

// 모바일 뷰 상태 타입
type MobileView = "tree" | "detail";

export function WorkMapView({ items }: WorkMapViewProps) {
  const { projects, persons, getProjectByName, getModuleByName, getFeatureByName, getPersonFeatureItems } =
    useWorkMapData(items);

  // 초기 프로젝트/사람 이름 목록 (persistence 초기화용)
  const initialProjects = useMemo(() => projects.map((p) => p.name), [projects]);
  const initialPersons = useMemo(() => persons.map((p) => p.name), [persons]);

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
    isInitialized,
  } = useWorkMapPersistence({
    initialProjects,
    initialPersons,
  });

  const [selection, setSelection] = useState<WorkMapSelection>({
    project: null,
    module: null,
    feature: null,
  });

  // 사람 뷰 선택 상태
  const [personSelection, setPersonSelection] = useState<PersonSelection>({
    person: null,
    domain: null,
    project: null,
    module: null,
    feature: null,
  });

  // 트리 너비 조절 상태 (기본 450px, Tailwind의 w-[450px]에 해당)
  const [treeWidth, setTreeWidth] = useState(450);
  const isResizing = useRef(false);
  
  // 네트워크 영역 높이 조절 상태 (기본 480px)
  const [networkHeight, setNetworkHeight] = useState(480);
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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, [treeWidth]);

  // 현재 선택된 레벨과 아이템 (프로젝트 뷰)
  const getSelectedItems = (): ScrumItem[] => {
    if (!selection.project) return [];
    
    // 피쳐 레벨 선택
    if (selection.module && selection.feature) {
      const feature = getFeatureByName(selection.project, selection.module, selection.feature);
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
    personSelection.person && personSelection.domain && personSelection.project && personSelection.module && personSelection.feature
      ? getPersonFeatureItems(
          personSelection.person,
          personSelection.domain,
          personSelection.project,
          personSelection.module,
          personSelection.feature
        )
      : [];

  // 현재 활성화된 피쳐 아이템 (뷰 모드에 따라)
  const activeFeatureItems = viewMode === "project" 
    ? getSelectedItems()
    : selectedPersonFeatureItems;
  
  // 선택 레벨 표시용 문자열
  const getSelectionLabel = () => {
    if (!selection.project) return null;
    if (selection.feature) return `${selection.project} / ${selection.module} / ${selection.feature}`;
    if (selection.module) return `${selection.project} / ${selection.module}`;
    return selection.project;
  };

  // 피쳐 선택 핸들러 (프로젝트 뷰)
  const handleFeatureSelect = (project: string, module: string, feature: string) => {
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
        <div className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  // 모바일 뷰 렌더링
  if (isMobile) {
    return (
      <div className="h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
        {mobileView === "tree" ? (
          // 모바일: 트리 뷰 (전체 화면)
          <div className="flex-1 flex flex-col">
            {/* 트리 헤더 */}
            <div
              className="flex-shrink-0 px-4 py-3 border-b"
              style={{ 
                borderColor: "var(--notion-border)",
                background: "var(--notion-bg)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗺️</span>
                  <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                    Work Map
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* 100% 숨김 토글 */}
                  <button
                    onClick={() => setHideCompleted(!hideCompleted)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background: hideCompleted ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
                      color: hideCompleted ? "#3b82f6" : "var(--notion-text-muted)",
                      boxShadow: hideCompleted ? "inset 0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                    }}
                    title={hideCompleted ? "100% 항목 표시" : "100% 항목 숨기기"}
                  >
                    <span>✓</span>
                    <span className="hidden sm:inline">100%</span>
                  </button>
                  {/* 뷰 모드 토글 */}
                  <button
                    onClick={toggleViewMode}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background: viewMode === "person" ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
                      color: viewMode === "person" ? "#3b82f6" : "var(--notion-text-muted)",
                      boxShadow: viewMode === "person" ? "inset 0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                    }}
                  >
                    {viewMode === "project" ? (
                      <>
                        <span>📁</span>
                        <span>Project</span>
                      </>
                    ) : (
                      <>
                        <span>👤</span>
                        <span>Person</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
                {viewMode === "project" 
                  ? `${projects.length} projects · ${items.length} snapshots`
                  : `${persons.length} members · ${items.length} snapshots`
                }
              </div>
            </div>

            {/* 트리 컨텐츠 - 전체 화면 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-3" style={{ background: "var(--notion-bg)" }}>
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
                borderColor: "var(--notion-border)",
                background: "var(--notion-bg)",
              }}
            >
              <button
                onClick={handleBackToTree}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{ background: "var(--notion-bg-secondary)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--notion-text)" }}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <div 
                  className="text-sm font-medium truncate" 
                  style={{ color: "var(--notion-text)" }}
                >
                  {viewMode === "project" ? selection.feature : personSelection.feature}
                </div>
                <div 
                  className="text-xs truncate" 
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  {viewMode === "project" 
                    ? `${selection.project} / ${selection.module}`
                    : `${personSelection.person} / ${personSelection.domain}`
                  }
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
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "var(--notion-bg)",
                        border: "1px solid var(--notion-border)",
                        height: "300px",
                      }}
                    >
                      <div
                        className="px-4 py-2 border-b"
                        style={{ borderColor: "var(--notion-border)" }}
                      >
                        <h2 className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                          Collaboration Network
                        </h2>
                      </div>
                      <div className="p-2 h-[calc(100%-40px)] overflow-hidden">
                        <CollaborationNetworkV2 
                          items={activeFeatureItems} 
                          allItems={items}
                          featureName={viewMode === "project" ? (selection.feature || undefined) : (personSelection.feature || undefined)}
                        />
                      </div>
                    </div>
                  )}

                  {/* 스냅샷 목록 */}
                  <SnapshotList items={activeFeatureItems} />
                </>
              ) : (
                <div
                  className="flex-1 rounded-xl flex flex-col items-center justify-center py-12"
                  style={{
                    background: "var(--notion-bg)",
                    border: "1px solid var(--notion-border)",
                  }}
                >
                  <div
                    className="text-4xl mb-3 p-4 rounded-full"
                    style={{ background: "var(--notion-bg-secondary)" }}
                  >
                    📄
                  </div>
                  <div className="text-base font-medium mb-1" style={{ color: "var(--notion-text)" }}>
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
      className="flex"
      style={{ height: "calc(100vh - 120px)", minHeight: "600px" }}
    >
      {/* 좌측: 디렉토리 트리 */}
      <div
        className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
        style={{
          width: treeWidth,
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 트리 헤더 */}
        <div
          className="flex-shrink-0 px-4 py-3 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                Work Map
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 100% 숨김 토글 */}
              <button
                onClick={() => setHideCompleted(!hideCompleted)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: hideCompleted ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
                  color: hideCompleted ? "#3b82f6" : "var(--notion-text-muted)",
                  boxShadow: hideCompleted ? "inset 0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                }}
                title={hideCompleted ? "100% 항목 표시" : "100% 항목 숨기기"}
              >
                <span>✓</span>
                <span>100%</span>
              </button>
              {/* 뷰 모드 토글 */}
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: viewMode === "person" ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
                  color: viewMode === "person" ? "#3b82f6" : "var(--notion-text-muted)",
                  boxShadow: viewMode === "person" ? "inset 0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                }}
              >
                {viewMode === "project" ? (
                  <>
                    <span>📁</span>
                    <span>Project</span>
                  </>
                ) : (
                  <>
                    <span>👤</span>
                    <span>Person</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
            {viewMode === "project" 
              ? `${projects.length} projects · ${items.length} snapshots`
              : `${persons.length} members · ${items.length} snapshots`
            }
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
        <div
          className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center"
        >
          <div
            className="w-1 h-8 rounded-full transition-colors group-hover:bg-blue-400"
            style={{ background: "var(--notion-border)" }}
          />
        </div>
      </div>

      {/* 우측: 협업 네트워크 + 스냅샷 */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 ml-3">
        {/* 선택된 정보 헤더 */}
        {activeFeatureItems.length > 0 && (
          <div
            className="flex-shrink-0 px-5 py-3 rounded-xl"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--notion-text-muted)" }}>
              {viewMode === "project" ? (
                <>
                  <span className={!selection.module ? "font-semibold" : ""} style={{ color: !selection.module ? "var(--notion-text)" : undefined }}>
                    {selection.project}
                  </span>
                  {selection.module && (
                    <>
                      <span>/</span>
                      <span className={!selection.feature ? "font-semibold" : ""} style={{ color: !selection.feature ? "var(--notion-text)" : undefined }}>
                        {selection.module}
                      </span>
                    </>
                  )}
                  {selection.feature && (
                    <>
                      <span>/</span>
                      <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                        {selection.feature}
                      </span>
                    </>
                  )}
                  {/* 레벨 표시 */}
                  <span 
                    className="ml-2 text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "var(--notion-bg-secondary)" }}
                  >
                    {selection.feature ? "Feature" : selection.module ? "Module" : "Project"}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold" style={{ color: "var(--notion-accent)" }}>
                    {personSelection.person}
                  </span>
                  <span>/</span>
                  <span>{personSelection.domain}</span>
                  <span>/</span>
                  <span>{personSelection.project}</span>
                  <span>/</span>
                  <span>{personSelection.module}</span>
                  <span>/</span>
                  <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                    {personSelection.feature}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {activeFeatureItems.length > 0 ? (
          <>
            {/* 협업 네트워크 */}
            {hasCollaborators && (
              <div className="flex-shrink-0 flex flex-col">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--notion-bg)",
                    border: "1px solid var(--notion-border)",
                    height: networkHeight,
                    minHeight: "250px",
                  }}
                >
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: "var(--notion-border)" }}
                  >
                    <h2 className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                      Collaboration Network
                    </h2>
                  </div>
                <div className="p-4 h-[calc(100%-48px)] overflow-hidden">
                  <CollaborationNetworkV2 
                    items={activeFeatureItems} 
                    allItems={items}
                    featureName={viewMode === "project" ? (selection.feature || undefined) : (personSelection.feature || undefined)}
                  />
                </div>
                </div>
                {/* 네트워크 높이 조절 핸들 */}
                <div
                  className="h-2 flex-shrink-0 cursor-row-resize group flex items-center justify-center"
                  onMouseDown={(e) => {
                    isNetworkResizing.current = true;
                    e.preventDefault();

                    const startY = e.clientY;
                    const startHeight = networkHeight;

                    const handleMouseMove = (moveE: MouseEvent) => {
                      if (!isNetworkResizing.current) return;
                      const delta = moveE.clientY - startY;
                      const newHeight = Math.max(250, Math.min(700, startHeight + delta));
                      setNetworkHeight(newHeight);
                    };

                    const handleMouseUp = () => {
                      isNetworkResizing.current = false;
                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  <div
                    className="w-12 h-1 rounded-full transition-colors group-hover:bg-blue-400"
                    style={{ background: "var(--notion-border)" }}
                  />
                </div>
              </div>
            )}

            {/* 스냅샷 목록 */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ minHeight: "200px" }}
            >
              <SnapshotList items={activeFeatureItems} />
            </div>
          </>
        ) : (
          /* 빈 상태 */
          <div
            className="flex-1 rounded-xl flex flex-col items-center justify-center"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <div
              className="text-6xl mb-4 p-6 rounded-full"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              📄
            </div>
            <div className="text-lg font-medium mb-2" style={{ color: "var(--notion-text)" }}>
              피쳐를 선택하세요
            </div>
            <div className="text-sm text-center" style={{ color: "var(--notion-text-muted)" }}>
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
