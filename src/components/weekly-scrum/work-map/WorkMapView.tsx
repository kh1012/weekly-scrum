"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { ProjectList } from "./ProjectList";
import { ModuleList } from "./ModuleList";
import { FeatureList } from "./FeatureList";
import { FeatureDetail } from "./FeatureDetail";

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

  // 현재 선택된 프로젝트
  const selectedProject = selection.project
    ? getProjectByName(selection.project)
    : null;

  // 현재 선택된 모듈
  const selectedModule =
    selection.project && selection.module
      ? getModuleByName(selection.project, selection.module)
      : null;

  // 현재 선택된 피쳐
  const selectedFeature =
    selection.project && selection.module && selection.feature
      ? getFeatureByName(selection.project, selection.module, selection.feature)
      : null;

  // 프로젝트 선택
  const handleSelectProject = (projectName: string) => {
    setSelection({
      project: projectName,
      module: null,
      feature: null,
    });
  };

  // 모듈 선택
  const handleSelectModule = (moduleName: string) => {
    setSelection((prev) => ({
      ...prev,
      module: moduleName,
      feature: null,
    }));
  };

  // 피쳐 선택
  const handleSelectFeature = (featureName: string) => {
    setSelection((prev) => ({
      ...prev,
      feature: featureName,
    }));
  };

  // 빵가루(Breadcrumb) 네비게이션
  const renderBreadcrumb = () => {
    const crumbs: { label: string; onClick: () => void }[] = [
      {
        label: "All Projects",
        onClick: () => setSelection({ project: null, module: null, feature: null }),
      },
    ];

    if (selection.project) {
      crumbs.push({
        label: selection.project,
        onClick: () =>
          setSelection({ project: selection.project, module: null, feature: null }),
      });
    }

    if (selection.module) {
      crumbs.push({
        label: selection.module,
        onClick: () =>
          setSelection({
            project: selection.project,
            module: selection.module,
            feature: null,
          }),
      });
    }

    if (selection.feature) {
      crumbs.push({
        label: selection.feature,
        onClick: () => {},
      });
    }

    return (
      <div className="flex items-center gap-1.5 text-sm flex-wrap">
        {crumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: "var(--notion-text-muted)" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <button
              onClick={crumb.onClick}
              className={`px-2 py-1 rounded transition-colors ${
                index === crumbs.length - 1
                  ? "font-semibold"
                  : "hover:bg-opacity-50"
              }`}
              style={{
                color:
                  index === crumbs.length - 1
                    ? "var(--notion-text)"
                    : "var(--notion-text-secondary)",
                background:
                  index === crumbs.length - 1
                    ? "var(--notion-bg-active)"
                    : "transparent",
              }}
              disabled={index === crumbs.length - 1}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>
    );
  };

  // 패널 헤더 컴포넌트
  const PanelHeader = ({
    title,
    count,
    isActive,
  }: {
    title: string;
    count?: number;
    isActive?: boolean;
  }) => (
    <div
      className="flex items-center justify-between mb-3"
    >
      <h3
        className="text-sm font-bold uppercase tracking-wider"
        style={{ color: isActive ? "var(--notion-accent)" : "var(--notion-text-muted)" }}
      >
        {title}
      </h3>
      {count !== undefined && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: isActive ? "var(--notion-accent-light)" : "var(--notion-bg-secondary)",
            color: isActive ? "var(--notion-accent)" : "var(--notion-text-muted)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* 헤더 영역 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--notion-text)" }}>
            Work Map
          </h1>
          <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {items.length} snapshots · {projects.length} projects
          </div>
        </div>
        {renderBreadcrumb()}
      </div>

      {/* 상단: Project → Module → Feature 네비게이션 (수평) */}
      <div
        className="flex-shrink-0 grid grid-cols-3 gap-4 mb-4"
        style={{ maxHeight: "280px" }}
      >
        {/* Projects 패널 */}
        <div
          className="flex flex-col rounded-xl overflow-hidden"
          style={{
            background: "var(--notion-bg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="px-4 pt-3">
            <PanelHeader
              title="Projects"
              count={projects.length}
              isActive={!selection.project}
            />
          </div>
          <div
            className="flex-1 overflow-y-auto px-3 pb-3"
            style={{ maxHeight: "220px" }}
          >
            <ProjectList
              projects={projects}
              selectedProject={selection.project}
              onSelectProject={handleSelectProject}
            />
          </div>
        </div>

        {/* Modules 패널 */}
        <div
          className={`flex flex-col rounded-xl overflow-hidden transition-opacity ${
            selectedProject ? "opacity-100" : "opacity-40"
          }`}
          style={{
            background: "var(--notion-bg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="px-4 pt-3">
            <PanelHeader
              title="Modules"
              count={selectedProject?.modules.length}
              isActive={!!selection.project && !selection.module}
            />
          </div>
          <div
            className="flex-1 overflow-y-auto px-3 pb-3"
            style={{ maxHeight: "220px" }}
          >
            {selectedProject ? (
              <ModuleList
                modules={selectedProject.modules}
                selectedModule={selection.module}
                onSelectModule={handleSelectModule}
              />
            ) : (
              <div
                className="h-full flex items-center justify-center text-sm"
                style={{ color: "var(--notion-text-muted)" }}
              >
                프로젝트를 선택하세요
              </div>
            )}
          </div>
        </div>

        {/* Features 패널 */}
        <div
          className={`flex flex-col rounded-xl overflow-hidden transition-opacity ${
            selectedModule ? "opacity-100" : "opacity-40"
          }`}
          style={{
            background: "var(--notion-bg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="px-4 pt-3">
            <PanelHeader
              title="Features"
              count={selectedModule?.features.length}
              isActive={!!selection.module && !selection.feature}
            />
          </div>
          <div
            className="flex-1 overflow-y-auto px-3 pb-3"
            style={{ maxHeight: "220px" }}
          >
            {selectedModule ? (
              <FeatureList
                features={selectedModule.features}
                selectedFeature={selection.feature}
                onSelectFeature={handleSelectFeature}
              />
            ) : (
              <div
                className="h-full flex items-center justify-center text-sm"
                style={{ color: "var(--notion-text-muted)" }}
              >
                모듈을 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단: Detail 패널 (가로폭 전체) */}
      <div
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
          minHeight: "400px",
        }}
      >
        <div className="h-full flex flex-col">
          {/* Detail 헤더 */}
          <div
            className="flex-shrink-0 px-6 py-4 border-b"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--notion-text)" }}
                >
                  {selectedFeature ? selectedFeature.name : "Feature Detail"}
                </h2>
                {selectedFeature && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: "var(--notion-accent-light)",
                      color: "var(--notion-accent)",
                    }}
                  >
                    {selectedFeature.items.length} snapshots
                  </span>
                )}
              </div>
              {selectedFeature && (
                <div className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  {selection.project} / {selection.module}
                </div>
              )}
            </div>
          </div>

          {/* Detail 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedFeature ? (
              <FeatureDetail
                featureName={selectedFeature.name}
                items={selectedFeature.items}
              />
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center"
                style={{ color: "var(--notion-text-muted)" }}
              >
                <div
                  className="text-6xl mb-4 p-6 rounded-full"
                  style={{ background: "var(--notion-bg-secondary)" }}
                >
                  🗺️
                </div>
                <div className="text-lg font-medium mb-2">피쳐를 선택하세요</div>
                <div className="text-sm">
                  상단에서 Project → Module → Feature를 선택하면
                </div>
                <div className="text-sm">상세 정보와 협업 네트워크가 표시됩니다</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
