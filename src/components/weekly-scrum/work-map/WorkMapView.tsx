"use client";

import { useState, useRef, useCallback } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection, TreeViewMode } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { DirectoryTree, PersonTree } from "./DirectoryTree";
import { CollaborationNetworkV2 } from "./CollaborationNetworkV2";
import { SnapshotList } from "./SnapshotList";

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

export function WorkMapView({ items }: WorkMapViewProps) {
  const { projects, persons, getProjectByName, getModuleByName, getFeatureByName, getPersonFeatureItems } =
    useWorkMapData(items);

  // 트리 뷰 모드 상태
  const [viewMode, setViewMode] = useState<TreeViewMode>("project");

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

  // 현재 선택된 피쳐 (프로젝트 뷰)
  const selectedFeature =
    selection.project && selection.module && selection.feature
      ? getFeatureByName(selection.project, selection.module, selection.feature)
      : null;

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
    ? selectedFeature?.items || []
    : selectedPersonFeatureItems;

  // 피쳐 선택 핸들러 (프로젝트 뷰)
  const handleFeatureSelect = (project: string, module: string, feature: string) => {
    setSelection({ project, module, feature });
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
  };

  // 선택된 피쳐의 협업자 존재 여부
  const hasCollaborators = activeFeatureItems.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );

  // 뷰 모드 토글
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "project" ? "person" : "project"));
  };

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
            {/* 뷰 모드 토글 */}
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                background: viewMode === "person" ? "var(--notion-accent-light)" : "var(--notion-bg-secondary)",
                color: viewMode === "person" ? "var(--notion-accent)" : "var(--notion-text-muted)",
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
            />
          ) : (
            <PersonTree
              persons={persons}
              selectedFeature={personSelection}
              onFeatureSelect={handlePersonFeatureSelect}
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
        {/* 선택된 피쳐 정보 헤더 */}
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
                  <span>{selection.project}</span>
                  <span>/</span>
                  <span>{selection.module}</span>
                  <span>/</span>
                  <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                    {selection.feature}
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
