"use client";

import { useState, useEffect } from "react";
import type { ProjectNode, ModuleNode, FeatureNode, WorkMapSelection } from "./types";
import { computeProjectMetrics, computeModuleMetrics, computeFeatureMetrics } from "./metricsUtils";
import { getProgressColor, getRiskColor } from "./MetricsIndicator";

interface DirectoryTreeProps {
  projects: ProjectNode[];
  selectedFeature?: WorkMapSelection;
  onFeatureSelect: (project: string, module: string, feature: string) => void;
}

interface ExpandedState {
  projects: Set<string>;
  modules: Set<string>;
}

/**
 * 트렌디한 디렉토리 트리 컴포넌트
 */
export function DirectoryTree({ projects, selectedFeature, onFeatureSelect }: DirectoryTreeProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({
    projects: new Set(projects.map((p) => p.name)),
    modules: new Set(),
  });

  // 선택된 피쳐가 있으면 해당 경로를 자동으로 펼침
  useEffect(() => {
    if (selectedFeature?.project && selectedFeature?.module) {
      setExpanded((prev) => ({
        projects: new Set([...prev.projects, selectedFeature.project!]),
        modules: new Set([...prev.modules, `${selectedFeature.project}/${selectedFeature.module}`]),
      }));
    }
  }, [selectedFeature]);

  const toggleProject = (projectName: string) => {
    setExpanded((prev) => {
      const newProjects = new Set(prev.projects);
      if (newProjects.has(projectName)) {
        newProjects.delete(projectName);
      } else {
        newProjects.add(projectName);
      }
      return { ...prev, projects: newProjects };
    });
  };

  const toggleModule = (moduleKey: string) => {
    setExpanded((prev) => {
      const newModules = new Set(prev.modules);
      if (newModules.has(moduleKey)) {
        newModules.delete(moduleKey);
      } else {
        newModules.add(moduleKey);
      }
      return { ...prev, modules: newModules };
    });
  };

  // 모두 펼치기
  const expandAll = () => {
    const allModules = new Set<string>();
    projects.forEach((p) => {
      p.modules.forEach((m) => {
        allModules.add(`${p.name}/${m.name}`);
      });
    });
    setExpanded({
      projects: new Set(projects.map((p) => p.name)),
      modules: allModules,
    });
  };

  // 모두 접기
  const collapseAll = () => {
    setExpanded({
      projects: new Set(),
      modules: new Set(),
    });
  };

  // 전체 통계 계산
  const totalModules = projects.reduce((sum, p) => sum + p.modules.length, 0);
  const totalFeatures = projects.reduce(
    (sum, p) => sum + p.modules.reduce((s, m) => s + m.features.length, 0),
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
          {totalModules} modules · {totalFeatures} features
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
          >
            펼침
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
          >
            접기
          </button>
        </div>
      </div>

      {/* 트리 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project, index) => (
          <ProjectItem
            key={project.name}
            project={project}
            isExpanded={expanded.projects.has(project.name)}
            expandedModules={expanded.modules}
            selectedFeature={selectedFeature}
            onToggle={() => toggleProject(project.name)}
            onModuleToggle={toggleModule}
            onFeatureSelect={onFeatureSelect}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 프로젝트 아이템
 */
function ProjectItem({
  project,
  isExpanded,
  expandedModules,
  selectedFeature,
  onToggle,
  onModuleToggle,
  onFeatureSelect,
  isFirst,
}: {
  project: ProjectNode;
  isExpanded: boolean;
  expandedModules: Set<string>;
  selectedFeature?: WorkMapSelection;
  onToggle: () => void;
  onModuleToggle: (key: string) => void;
  onFeatureSelect: (project: string, module: string, feature: string) => void;
  isFirst: boolean;
}) {
  const metrics = computeProjectMetrics(project);
  const progressColor = getProgressColor(metrics.progress);

  // 완료된 피쳐 수 계산 (progress >= 100)
  const totalFeatures = project.modules.reduce((sum, m) => sum + m.features.length, 0);
  const completedFeatures = project.modules.reduce(
    (sum, m) =>
      sum +
      m.features.filter((f) => {
        const fm = computeFeatureMetrics(f);
        return fm.progress >= 100;
      }).length,
    0
  );

  return (
    <div className="select-none">
      {/* 프로젝트 구분선 (첫 번째가 아닐 때) */}
      {!isFirst && (
        <div
          className="mx-2 my-3"
          style={{ borderTop: "1px solid var(--notion-border)" }}
        />
      )}

      {/* 프로젝트 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all"
        style={{ background: "var(--notion-bg-secondary)" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--notion-bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--notion-bg-secondary)"}
      >
        {/* 화살표 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 프로젝트명 */}
        <span
          className="flex-1 text-left font-semibold text-sm truncate"
          style={{ color: "var(--notion-text)" }}
        >
          {project.name}
        </span>

        {/* 완료 현황 */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ 
            background: "var(--notion-bg)", 
            color: "var(--notion-text-muted)",
          }}
        >
          {completedFeatures}/{totalFeatures}
        </span>

        {/* 진행률 */}
        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {metrics.progress}%
        </span>
      </button>

      {/* 모듈 목록 */}
      {isExpanded && (
        <div className="ml-4 mt-2 pl-3 border-l-2" style={{ borderColor: "var(--notion-border)" }}>
          {project.modules.map((module, index) => {
            const moduleKey = `${project.name}/${module.name}`;
            return (
              <ModuleItem
                key={module.name}
                module={module}
                projectName={project.name}
                isExpanded={expandedModules.has(moduleKey)}
                selectedFeature={selectedFeature}
                onToggle={() => onModuleToggle(moduleKey)}
                onFeatureSelect={onFeatureSelect}
                isFirst={index === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 모듈 아이템
 */
function ModuleItem({
  module,
  projectName,
  isExpanded,
  selectedFeature,
  onToggle,
  onFeatureSelect,
  isFirst,
}: {
  module: ModuleNode;
  projectName: string;
  isExpanded: boolean;
  selectedFeature?: WorkMapSelection;
  onToggle: () => void;
  onFeatureSelect: (project: string, module: string, feature: string) => void;
  isFirst: boolean;
}) {
  const metrics = computeModuleMetrics(module);
  const progressColor = getProgressColor(metrics.progress);

  // 완료된 피쳐 수 계산
  const completedFeatures = module.features.filter((f) => {
    const fm = computeFeatureMetrics(f);
    return fm.progress >= 100;
  }).length;

  return (
    <div className={isFirst ? "" : "mt-2"}>
      {/* 모듈 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--notion-bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        {/* 화살표 */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 모듈명 */}
        <span
          className="flex-1 text-left font-medium text-[13px] truncate"
          style={{ color: "var(--notion-text)" }}
        >
          {module.name}
        </span>

        {/* 완료 현황 */}
        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {completedFeatures}/{module.features.length}
        </span>

        {/* 진행률 */}
        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {metrics.progress}%
        </span>
      </button>

      {/* 피쳐 목록 */}
      {isExpanded && (
        <div className="ml-3 mt-1 pl-3 border-l" style={{ borderColor: "var(--notion-border)" }}>
          {module.features.map((feature) => (
            <FeatureItem
              key={feature.name}
              feature={feature}
              projectName={projectName}
              moduleName={module.name}
              isSelected={
                selectedFeature?.project === projectName &&
                selectedFeature?.module === module.name &&
                selectedFeature?.feature === feature.name
              }
              onSelect={onFeatureSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 피쳐 아이템
 */
function FeatureItem({
  feature,
  projectName,
  moduleName,
  isSelected,
  onSelect,
}: {
  feature: FeatureNode;
  projectName: string;
  moduleName: string;
  isSelected: boolean;
  onSelect: (project: string, module: string, feature: string) => void;
}) {
  const metrics = computeFeatureMetrics(feature);
  const progressColor = getProgressColor(metrics.progress);

  // 완료된 태스크 수 계산
  const totalTasks = metrics.taskCount;
  const completedTasks = metrics.completedTaskCount;

  return (
    <button
      onClick={() => onSelect(projectName, moduleName, feature.name)}
      className="w-full flex items-center gap-2 pl-2 pr-2 py-1 rounded transition-all"
      style={{
        background: isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent",
        borderLeft: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
        marginLeft: "-2px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "var(--notion-bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent";
      }}
    >
      {/* 피쳐명 */}
      <span
        className="flex-1 text-left text-[12px] truncate"
        style={{
          color: isSelected ? "#3b82f6" : "var(--notion-text-secondary)",
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {feature.name}
      </span>

      {/* 태스크 완료 현황 */}
      <span
        className="text-[10px] flex-shrink-0"
        style={{ color: "var(--notion-text-muted)" }}
      >
        {completedTasks}/{totalTasks}
      </span>

      {/* 진행률 바 */}
      <div
        className="w-8 h-1 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${metrics.progress}%`, background: progressColor }}
        />
      </div>

      {/* 진행률 텍스트 */}
      <span
        className="text-[10px] font-bold w-7 text-right flex-shrink-0"
        style={{ color: progressColor }}
      >
        {metrics.progress}%
      </span>
    </button>
  );
}
