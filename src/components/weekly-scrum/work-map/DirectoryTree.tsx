"use client";

import { useState } from "react";
import type { ProjectNode, ModuleNode, FeatureNode } from "./types";
import { computeProjectMetrics, computeModuleMetrics, computeFeatureMetrics } from "./metricsUtils";
import { getProgressColor, getRiskColor } from "./MetricsIndicator";

interface DirectoryTreeProps {
  projects: ProjectNode[];
  onFeatureSelect: (project: string, module: string, feature: string) => void;
}

interface ExpandedState {
  projects: Set<string>;
  modules: Set<string>;
}

/**
 * 트렌디한 디렉토리 트리 컴포넌트
 */
export function DirectoryTree({ projects, onFeatureSelect }: DirectoryTreeProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({
    projects: new Set(projects.map((p) => p.name)), // 기본적으로 모든 프로젝트 펼침
    modules: new Set(),
  });

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

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#22c55e" }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--notion-text-muted)" }}>
            {projects.length} Projects
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
          >
            펼치기
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
      <div className="flex-1 overflow-y-auto space-y-1">
        {projects.map((project) => (
          <ProjectItem
            key={project.name}
            project={project}
            isExpanded={expanded.projects.has(project.name)}
            expandedModules={expanded.modules}
            onToggle={() => toggleProject(project.name)}
            onModuleToggle={toggleModule}
            onFeatureSelect={onFeatureSelect}
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
  onToggle,
  onModuleToggle,
  onFeatureSelect,
}: {
  project: ProjectNode;
  isExpanded: boolean;
  expandedModules: Set<string>;
  onToggle: () => void;
  onModuleToggle: (key: string) => void;
  onFeatureSelect: (project: string, module: string, feature: string) => void;
}) {
  const metrics = computeProjectMetrics(project);
  const progressColor = getProgressColor(metrics.progress);

  return (
    <div className="select-none">
      {/* 프로젝트 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-opacity-80 group"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        {/* 화살표 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 폴더 아이콘 */}
        <span className="text-lg">
          {isExpanded ? "📂" : "📁"}
        </span>

        {/* 프로젝트명 */}
        <span
          className="flex-1 text-left font-semibold text-sm"
          style={{ color: "var(--notion-text)" }}
        >
          {project.name}
        </span>

        {/* 메트릭 */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${progressColor}20`, color: progressColor }}
          >
            {metrics.progress}%
          </span>
        </div>

        {/* 모듈 수 */}
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: "var(--notion-bg)", color: "var(--notion-text-muted)" }}
        >
          {project.modules.length}
        </span>
      </button>

      {/* 모듈 목록 */}
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l-2" style={{ borderColor: "var(--notion-border)" }}>
          {project.modules.map((module) => {
            const moduleKey = `${project.name}/${module.name}`;
            return (
              <ModuleItem
                key={module.name}
                module={module}
                projectName={project.name}
                isExpanded={expandedModules.has(moduleKey)}
                onToggle={() => onModuleToggle(moduleKey)}
                onFeatureSelect={onFeatureSelect}
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
  onToggle,
  onFeatureSelect,
}: {
  module: ModuleNode;
  projectName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onFeatureSelect: (project: string, module: string, feature: string) => void;
}) {
  const metrics = computeModuleMetrics(module);
  const progressColor = getProgressColor(metrics.progress);

  return (
    <div className="pl-3">
      {/* 모듈 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all hover:bg-opacity-80 group"
        style={{ background: "transparent" }}
      >
        {/* 화살표 */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 폴더 아이콘 */}
        <span className="text-base">
          {isExpanded ? "📂" : "📁"}
        </span>

        {/* 모듈명 */}
        <span
          className="flex-1 text-left font-medium text-sm"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          {module.name}
        </span>

        {/* 진행률 바 */}
        <div
          className="w-16 h-1.5 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "var(--notion-bg-secondary)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${metrics.progress}%`, background: progressColor }}
          />
        </div>

        {/* 피쳐 수 */}
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
        >
          {module.features.length}
        </span>
      </button>

      {/* 피쳐 목록 */}
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-0.5 border-l" style={{ borderColor: "var(--notion-border)" }}>
          {module.features.map((feature) => (
            <FeatureItem
              key={feature.name}
              feature={feature}
              projectName={projectName}
              moduleName={module.name}
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
  onSelect,
}: {
  feature: FeatureNode;
  projectName: string;
  moduleName: string;
  onSelect: (project: string, module: string, feature: string) => void;
}) {
  const metrics = computeFeatureMetrics(feature);
  const progressColor = getProgressColor(metrics.progress);
  const riskColors = getRiskColor(metrics.riskLevel);
  const memberCount = new Set(feature.items.map((i) => i.name)).size;

  return (
    <button
      onClick={() => onSelect(projectName, moduleName, feature.name)}
      className="w-full flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md transition-all hover:bg-opacity-80 group"
      style={{ background: "transparent" }}
    >
      {/* 파일 아이콘 */}
      <span className="text-sm">📄</span>

      {/* 피쳐명 */}
      <span
        className="flex-1 text-left text-sm truncate"
        style={{ color: "var(--notion-text-secondary)" }}
      >
        {feature.name}
      </span>

      {/* 호버 시 상세 정보 */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 멤버 수 */}
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
        >
          {memberCount}명
        </span>

        {/* 리스크 */}
        {metrics.riskLevel !== null && metrics.riskLevel > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: riskColors.bg, color: riskColors.text }}
          >
            R{metrics.riskLevel}
          </span>
        )}

        {/* 진행률 */}
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: `${progressColor}20`, color: progressColor }}
        >
          {metrics.progress}%
        </span>
      </div>

      {/* 화살표 */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--notion-text-muted)" }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

