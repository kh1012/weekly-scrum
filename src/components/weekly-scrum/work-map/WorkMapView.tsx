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
        label: "Projects",
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
      <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
        {crumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span style={{ color: "var(--notion-text-muted)" }}>→</span>
            )}
            <button
              onClick={crumb.onClick}
              className={`hover:underline ${
                index === crumbs.length - 1 ? "font-medium" : ""
              }`}
              style={{
                color:
                  index === crumbs.length - 1
                    ? "var(--notion-text)"
                    : "var(--notion-text-secondary)",
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
    subtitle,
    isActive,
  }: {
    title: string;
    subtitle?: string;
    isActive?: boolean;
  }) => (
    <div
      className="px-3 py-2 border-b flex items-center justify-between"
      style={{
        borderColor: "var(--notion-border)",
        background: isActive ? "var(--notion-bg-active)" : "var(--notion-bg)",
      }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: isActive ? "var(--notion-accent)" : "var(--notion-text-muted)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
          {subtitle}
        </span>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--notion-text)" }}>
          Work Map
        </h1>
        <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
          Project → Module → Feature 구조로 작업 현황을 탐색합니다.
        </p>
      </div>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Box-to-Box 레이아웃 */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Projects 패널 */}
        <div
          className="w-56 flex-shrink-0 rounded-lg overflow-hidden flex flex-col"
          style={{ border: "1px solid var(--notion-border)" }}
        >
          <PanelHeader
            title="Projects"
            subtitle={`${projects.length}`}
            isActive={!selection.project}
          />
          <div
            className="flex-1 overflow-y-auto p-2"
            style={{ background: "var(--notion-bg)" }}
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
          className={`w-56 flex-shrink-0 rounded-lg overflow-hidden flex flex-col transition-opacity ${
            selectedProject ? "opacity-100" : "opacity-50"
          }`}
          style={{ border: "1px solid var(--notion-border)" }}
        >
          <PanelHeader
            title="Modules"
            subtitle={selectedProject ? `${selectedProject.modules.length}` : "—"}
            isActive={!!selection.project && !selection.module}
          />
          <div
            className="flex-1 overflow-y-auto p-2"
            style={{ background: "var(--notion-bg)" }}
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
          className={`w-56 flex-shrink-0 rounded-lg overflow-hidden flex flex-col transition-opacity ${
            selectedModule ? "opacity-100" : "opacity-50"
          }`}
          style={{ border: "1px solid var(--notion-border)" }}
        >
          <PanelHeader
            title="Features"
            subtitle={selectedModule ? `${selectedModule.features.length}` : "—"}
            isActive={!!selection.module && !selection.feature}
          />
          <div
            className="flex-1 overflow-y-auto p-2"
            style={{ background: "var(--notion-bg)" }}
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

        {/* Feature Detail 패널 */}
        <div
          className={`flex-1 min-w-80 rounded-lg overflow-hidden flex flex-col transition-opacity ${
            selectedFeature ? "opacity-100" : "opacity-50"
          }`}
          style={{ border: "1px solid var(--notion-border)" }}
        >
          <PanelHeader
            title="Detail"
            subtitle={
              selectedFeature
                ? `${selectedFeature.items.length} snapshots`
                : "—"
            }
            isActive={!!selection.feature}
          />
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{ background: "var(--notion-bg)" }}
          >
            {selectedFeature ? (
              <FeatureDetail
                featureName={selectedFeature.name}
                items={selectedFeature.items}
              />
            ) : (
              <div
                className="h-full flex items-center justify-center text-sm"
                style={{ color: "var(--notion-text-muted)" }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🗺️</div>
                  <div>피쳐를 선택하면</div>
                  <div>상세 정보가 표시됩니다</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 안내 (필요시) */}
      <div className="lg:hidden mt-4 p-3 rounded-lg" style={{ background: "var(--notion-bg-secondary)" }}>
        <p className="text-xs text-center" style={{ color: "var(--notion-text-muted)" }}>
          더 나은 경험을 위해 데스크톱 환경에서 사용하세요
        </p>
      </div>
    </div>
  );
}
