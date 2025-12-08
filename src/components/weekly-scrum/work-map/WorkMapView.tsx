"use client";

import { useState, useRef, useCallback } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { DirectoryTree } from "./DirectoryTree";
import { CollaborationNetworkV2 } from "./CollaborationNetworkV2";
import { SnapshotList } from "./SnapshotList";

interface WorkMapViewProps {
  items: ScrumItem[];
}

export function WorkMapView({ items }: WorkMapViewProps) {
  const { projects, getProjectByName, getModuleByName, getFeatureByName } =
    useWorkMapData(items);

  const [selection, setSelection] = useState<WorkMapSelection>({
    project: null,
    module: null,
    feature: null,
  });

  // 트리 너비 조절 상태 (기본 450px, Tailwind의 w-[450px]에 해당)
  const [treeWidth, setTreeWidth] = useState(450);
  const isResizing = useRef(false);

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

  // 현재 선택된 피쳐
  const selectedFeature =
    selection.project && selection.module && selection.feature
      ? getFeatureByName(selection.project, selection.module, selection.feature)
      : null;

  // 피쳐 선택 핸들러
  const handleFeatureSelect = (project: string, module: string, feature: string) => {
    setSelection({ project, module, feature });
  };

  // 선택된 피쳐의 협업자 존재 여부
  const hasCollaborators = selectedFeature?.items.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );

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
          <div className="flex items-center gap-2">
            <span className="text-lg">🗺️</span>
            <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
              Work Map
            </span>
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
            {projects.length} projects · {items.length} snapshots
          </div>
        </div>

        {/* 트리 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-3">
          <DirectoryTree
            projects={projects}
            selectedFeature={selection}
            onFeatureSelect={handleFeatureSelect}
          />
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
        {selectedFeature && (
          <div
            className="flex-shrink-0 px-5 py-3 rounded-xl"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--notion-text-muted)" }}>
              <span>{selection.project}</span>
              <span>/</span>
              <span>{selection.module}</span>
              <span>/</span>
              <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                {selection.feature}
              </span>
            </div>
          </div>
        )}

        {selectedFeature ? (
          <>
            {/* 협업 네트워크 */}
            {hasCollaborators && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--notion-bg)",
                  border: "1px solid var(--notion-border)",
                  height: "45%",
                  minHeight: "300px",
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
                    items={selectedFeature.items} 
                    allItems={items}
                    featureName={selection.feature || undefined}
                  />
                </div>
              </div>
            )}

            {/* 스냅샷 목록 */}
            <div
              className="flex-1 rounded-xl overflow-hidden"
              style={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                minHeight: "200px",
              }}
            >
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--notion-border)" }}
              >
                <h2 className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                  Snapshots ({selectedFeature.items.length})
                </h2>
              </div>
              <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
                <SnapshotList items={selectedFeature.items} />
              </div>
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
