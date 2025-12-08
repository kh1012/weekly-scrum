"use client";

import { useState, useEffect } from "react";
import type {
  ProjectNode,
  ModuleNode,
  FeatureNode,
  WorkMapSelection,
  PersonNode,
  PersonDomainNode,
  PersonProjectNode,
  PersonModuleNode,
  PersonFeatureNode,
} from "./types";
import {
  computeProjectMetrics,
  computeModuleMetrics,
  computeFeatureMetrics,
} from "./metricsUtils";
import { getProgressColor, getRiskColor } from "./MetricsIndicator";
import type { ScrumItem } from "@/types/scrum";

/**
 * 협업자 존재 여부 확인 유틸리티
 */
function hasCollaborators(
  items: { collaborators?: { name: string }[] }[]
): boolean {
  return items.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );
}

/**
 * 네트워크 인디케이터 컴포넌트
 */
function NetworkIndicator({ size = "sm" }: { size?: "sm" | "xs" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-3 h-3";
  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center rounded-full flex-shrink-0`}
      style={{
        background: "rgba(59, 130, 246, 0.15)",
      }}
      title="협업 네트워크 존재"
    >
      <svg
        width={size === "sm" ? 10 : 8}
        height={size === "sm" ? 10 : 8}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="12" y2="12" />
        <line x1="12" y1="12" x2="5" y2="17" />
        <line x1="12" y1="12" x2="19" y2="17" />
      </svg>
    </span>
  );
}

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
export function DirectoryTree({
  projects,
  selectedFeature,
  onFeatureSelect,
}: DirectoryTreeProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({
    projects: new Set(projects.map((p) => p.name)),
    modules: new Set(),
  });

  // 선택된 피쳐가 있으면 해당 경로를 자동으로 펼침
  useEffect(() => {
    if (selectedFeature?.project && selectedFeature?.module) {
      setExpanded((prev) => ({
        projects: new Set([...prev.projects, selectedFeature.project!]),
        modules: new Set([
          ...prev.modules,
          `${selectedFeature.project}/${selectedFeature.module}`,
        ]),
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
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            펼침
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
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
  const hasNetwork = hasCollaborators(project.items);

  // 완료된 피쳐 수 계산 (progress >= 100)
  const totalFeatures = project.modules.reduce(
    (sum, m) => sum + m.features.length,
    0
  );
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
    <div className={`select-none ${isFirst ? "" : "mt-4"}`}>
      {/* 프로젝트 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* 화살표 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
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

        {/* 네트워크 인디케이터 */}
        {hasNetwork && <NetworkIndicator size="sm" />}

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
        <div
          className="ml-4 mt-2 pl-3 border-l-2"
          style={{ borderColor: "var(--notion-border)" }}
        >
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
  const hasNetwork = hasCollaborators(module.items);

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
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* 화살표 */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
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

        {/* 네트워크 인디케이터 */}
        {hasNetwork && <NetworkIndicator size="xs" />}

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
        <div
          className="ml-3 mt-1 pl-3 border-l"
          style={{ borderColor: "var(--notion-border)" }}
        >
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
  const hasNetwork = hasCollaborators(feature.items);

  // 완료된 태스크 수 계산
  const totalTasks = metrics.taskCount;
  const completedTasks = metrics.completedTaskCount;

  return (
    <button
      onClick={() => onSelect(projectName, moduleName, feature.name)}
      className="w-full flex items-center gap-2 pl-2 pr-2 py-1 rounded transition-all"
      style={{
        background: isSelected ? "var(--notion-bg-secondary)" : "transparent",
        marginLeft: "-2px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = "var(--notion-bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = isSelected
            ? "var(--notion-bg-secondary)"
            : "transparent";
      }}
    >
      {/* 피쳐명 */}
      <span
        className="flex-1 text-left text-[12px] truncate"
        style={{
          color: isSelected
            ? "var(--notion-text)"
            : "var(--notion-text-secondary)",
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {feature.name}
      </span>

      {/* 네트워크 인디케이터 */}
      {hasNetwork && <NetworkIndicator size="xs" />}

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

// ========================================
// Person Tree (사람 단위 뷰)
// ========================================

interface PersonSelection {
  person: string | null;
  domain: string | null;
  project: string | null;
  module: string | null;
  feature: string | null;
}

interface PersonTreeProps {
  persons: PersonNode[];
  selectedFeature?: PersonSelection;
  onFeatureSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
}

interface PersonExpandedState {
  persons: Set<string>;
  domains: Set<string>;
  projects: Set<string>;
  modules: Set<string>;
}

/**
 * 아이템 배열에서 평균 진행률 계산
 */
function computeItemsProgress(items: ScrumItem[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.progressPercent, 0);
  return Math.round(total / items.length);
}

/**
 * 사람 단위 디렉토리 트리 컴포넌트
 */
export function PersonTree({
  persons,
  selectedFeature,
  onFeatureSelect,
}: PersonTreeProps) {
  const [expanded, setExpanded] = useState<PersonExpandedState>({
    persons: new Set(persons.map((p) => p.name)),
    domains: new Set(),
    projects: new Set(),
    modules: new Set(),
  });

  // 선택된 피쳐가 있으면 해당 경로를 자동으로 펼침
  useEffect(() => {
    if (
      selectedFeature?.person &&
      selectedFeature?.domain &&
      selectedFeature?.project &&
      selectedFeature?.module
    ) {
      setExpanded((prev) => ({
        persons: new Set([...prev.persons, selectedFeature.person!]),
        domains: new Set([
          ...prev.domains,
          `${selectedFeature.person}/${selectedFeature.domain}`,
        ]),
        projects: new Set([
          ...prev.projects,
          `${selectedFeature.person}/${selectedFeature.domain}/${selectedFeature.project}`,
        ]),
        modules: new Set([
          ...prev.modules,
          `${selectedFeature.person}/${selectedFeature.domain}/${selectedFeature.project}/${selectedFeature.module}`,
        ]),
      }));
    }
  }, [selectedFeature]);

  const togglePerson = (name: string) => {
    setExpanded((prev) => {
      const newPersons = new Set(prev.persons);
      if (newPersons.has(name)) {
        newPersons.delete(name);
      } else {
        newPersons.add(name);
      }
      return { ...prev, persons: newPersons };
    });
  };

  const toggleDomain = (key: string) => {
    setExpanded((prev) => {
      const newDomains = new Set(prev.domains);
      if (newDomains.has(key)) {
        newDomains.delete(key);
      } else {
        newDomains.add(key);
      }
      return { ...prev, domains: newDomains };
    });
  };

  const toggleProject = (key: string) => {
    setExpanded((prev) => {
      const newProjects = new Set(prev.projects);
      if (newProjects.has(key)) {
        newProjects.delete(key);
      } else {
        newProjects.add(key);
      }
      return { ...prev, projects: newProjects };
    });
  };

  const toggleModule = (key: string) => {
    setExpanded((prev) => {
      const newModules = new Set(prev.modules);
      if (newModules.has(key)) {
        newModules.delete(key);
      } else {
        newModules.add(key);
      }
      return { ...prev, modules: newModules };
    });
  };

  // 모두 펼치기
  const expandAll = () => {
    const allDomains = new Set<string>();
    const allProjects = new Set<string>();
    const allModules = new Set<string>();

    persons.forEach((person) => {
      person.domains.forEach((domain) => {
        allDomains.add(`${person.name}/${domain.name}`);
        domain.projects.forEach((project) => {
          allProjects.add(`${person.name}/${domain.name}/${project.name}`);
          project.modules.forEach((module) => {
            allModules.add(
              `${person.name}/${domain.name}/${project.name}/${module.name}`
            );
          });
        });
      });
    });

    setExpanded({
      persons: new Set(persons.map((p) => p.name)),
      domains: allDomains,
      projects: allProjects,
      modules: allModules,
    });
  };

  // 모두 접기
  const collapseAll = () => {
    setExpanded({
      persons: new Set(),
      domains: new Set(),
      projects: new Set(),
      modules: new Set(),
    });
  };

  // 전체 통계
  const totalSnapshots = persons.reduce((sum, p) => sum + p.items.length, 0);

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
          {persons.length} members · {totalSnapshots} snapshots
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            펼침
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-opacity-80"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            접기
          </button>
        </div>
      </div>

      {/* 트리 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {persons.map((person, index) => (
          <PersonItem
            key={person.name}
            person={person}
            isExpanded={expanded.persons.has(person.name)}
            expandedDomains={expanded.domains}
            expandedProjects={expanded.projects}
            expandedModules={expanded.modules}
            selectedFeature={selectedFeature}
            onToggle={() => togglePerson(person.name)}
            onDomainToggle={toggleDomain}
            onProjectToggle={toggleProject}
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
 * 사람 아이템
 */
function PersonItem({
  person,
  isExpanded,
  expandedDomains,
  expandedProjects,
  expandedModules,
  selectedFeature,
  onToggle,
  onDomainToggle,
  onProjectToggle,
  onModuleToggle,
  onFeatureSelect,
  isFirst,
}: {
  person: PersonNode;
  isExpanded: boolean;
  expandedDomains: Set<string>;
  expandedProjects: Set<string>;
  expandedModules: Set<string>;
  selectedFeature?: PersonSelection;
  onToggle: () => void;
  onDomainToggle: (key: string) => void;
  onProjectToggle: (key: string) => void;
  onModuleToggle: (key: string) => void;
  onFeatureSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
  isFirst: boolean;
}) {
  const avgProgress = computeItemsProgress(person.items);
  const progressColor = getProgressColor(avgProgress);
  const hasNetwork = hasCollaborators(person.items);

  return (
    <div className={`select-none ${isFirst ? "" : "mt-4"}`}>
      {/* 사람 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 아바타 */}
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: "var(--notion-accent-light)",
            color: "var(--notion-accent)",
          }}
        >
          {person.name.charAt(0)}
        </span>

        <span
          className="flex-1 text-left font-semibold text-sm truncate"
          style={{ color: "var(--notion-text)" }}
        >
          {person.name}
        </span>

        {hasNetwork && <NetworkIndicator size="sm" />}

        <span
          className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{
            background: "var(--notion-bg)",
            color: "var(--notion-text-muted)",
          }}
        >
          {person.items.length}
        </span>

        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {avgProgress}%
        </span>
      </button>

      {/* 도메인 목록 */}
      {isExpanded && (
        <div
          className="ml-4 mt-2 pl-3 border-l-2"
          style={{ borderColor: "var(--notion-border)" }}
        >
          {person.domains.map((domain, index) => {
            const domainKey = `${person.name}/${domain.name}`;
            return (
              <PersonDomainItem
                key={domain.name}
                domain={domain}
                personName={person.name}
                isExpanded={expandedDomains.has(domainKey)}
                expandedProjects={expandedProjects}
                expandedModules={expandedModules}
                selectedFeature={selectedFeature}
                onToggle={() => onDomainToggle(domainKey)}
                onProjectToggle={onProjectToggle}
                onModuleToggle={onModuleToggle}
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
 * 사람 도메인 아이템
 */
function PersonDomainItem({
  domain,
  personName,
  isExpanded,
  expandedProjects,
  expandedModules,
  selectedFeature,
  onToggle,
  onProjectToggle,
  onModuleToggle,
  onFeatureSelect,
  isFirst,
}: {
  domain: PersonDomainNode;
  personName: string;
  isExpanded: boolean;
  expandedProjects: Set<string>;
  expandedModules: Set<string>;
  selectedFeature?: PersonSelection;
  onToggle: () => void;
  onProjectToggle: (key: string) => void;
  onModuleToggle: (key: string) => void;
  onFeatureSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
  isFirst: boolean;
}) {
  const avgProgress = computeItemsProgress(domain.items);
  const progressColor = getProgressColor(avgProgress);
  const hasNetwork = hasCollaborators(domain.items);

  return (
    <div className={isFirst ? "" : "mt-2"}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span className="text-[10px]">🏷️</span>

        <span
          className="flex-1 text-left font-medium text-[13px] truncate"
          style={{ color: "var(--notion-text)" }}
        >
          {domain.name}
        </span>

        {hasNetwork && <NetworkIndicator size="xs" />}

        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {domain.items.length}
        </span>

        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {avgProgress}%
        </span>
      </button>

      {isExpanded && (
        <div
          className="ml-3 mt-1 pl-3 border-l"
          style={{ borderColor: "var(--notion-border)" }}
        >
          {domain.projects.map((project, index) => {
            const projectKey = `${personName}/${domain.name}/${project.name}`;
            return (
              <PersonProjectItem
                key={project.name}
                project={project}
                personName={personName}
                domainName={domain.name}
                isExpanded={expandedProjects.has(projectKey)}
                expandedModules={expandedModules}
                selectedFeature={selectedFeature}
                onToggle={() => onProjectToggle(projectKey)}
                onModuleToggle={onModuleToggle}
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
 * 사람 프로젝트 아이템
 */
function PersonProjectItem({
  project,
  personName,
  domainName,
  isExpanded,
  expandedModules,
  selectedFeature,
  onToggle,
  onModuleToggle,
  onFeatureSelect,
  isFirst,
}: {
  project: PersonProjectNode;
  personName: string;
  domainName: string;
  isExpanded: boolean;
  expandedModules: Set<string>;
  selectedFeature?: PersonSelection;
  onToggle: () => void;
  onModuleToggle: (key: string) => void;
  onFeatureSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
  isFirst: boolean;
}) {
  const avgProgress = computeItemsProgress(project.items);
  const progressColor = getProgressColor(avgProgress);
  const hasNetwork = hasCollaborators(project.items);

  return (
    <div className={isFirst ? "" : "mt-1"}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1 rounded-md transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span className="text-[10px]">📁</span>

        <span
          className="flex-1 text-left text-[12px] truncate"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          {project.name}
        </span>

        {hasNetwork && <NetworkIndicator size="xs" />}

        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {project.items.length}
        </span>

        <span
          className="text-[10px] font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {avgProgress}%
        </span>
      </button>

      {isExpanded && (
        <div
          className="ml-3 mt-1 pl-3 border-l"
          style={{ borderColor: "var(--notion-border)" }}
        >
          {project.modules.map((module, index) => {
            const moduleKey = `${personName}/${domainName}/${project.name}/${module.name}`;
            return (
              <PersonModuleItem
                key={module.name}
                module={module}
                personName={personName}
                domainName={domainName}
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
 * 사람 모듈 아이템
 */
function PersonModuleItem({
  module,
  personName,
  domainName,
  projectName,
  isExpanded,
  selectedFeature,
  onToggle,
  onFeatureSelect,
  isFirst,
}: {
  module: PersonModuleNode;
  personName: string;
  domainName: string;
  projectName: string;
  isExpanded: boolean;
  selectedFeature?: PersonSelection;
  onToggle: () => void;
  onFeatureSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
  isFirst: boolean;
}) {
  const avgProgress = computeItemsProgress(module.items);
  const progressColor = getProgressColor(avgProgress);
  const hasNetwork = hasCollaborators(module.items);

  return (
    <div className={isFirst ? "" : "mt-1"}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1 rounded-md transition-all"
        style={{ background: "transparent" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--notion-bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span className="text-[10px]">📦</span>

        <span
          className="flex-1 text-left text-[11px] truncate"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          {module.name}
        </span>

        {hasNetwork && <NetworkIndicator size="xs" />}

        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {module.items.length}
        </span>

        <span
          className="text-[10px] font-bold flex-shrink-0"
          style={{ color: progressColor }}
        >
          {avgProgress}%
        </span>
      </button>

      {isExpanded && (
        <div
          className="ml-3 mt-1 pl-3 border-l"
          style={{ borderColor: "var(--notion-border)" }}
        >
          {module.features.map((feature) => (
            <PersonFeatureItem
              key={feature.name}
              feature={feature}
              personName={personName}
              domainName={domainName}
              projectName={projectName}
              moduleName={module.name}
              isSelected={
                selectedFeature?.person === personName &&
                selectedFeature?.domain === domainName &&
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
 * 사람 피쳐 아이템
 */
function PersonFeatureItem({
  feature,
  personName,
  domainName,
  projectName,
  moduleName,
  isSelected,
  onSelect,
}: {
  feature: PersonFeatureNode;
  personName: string;
  domainName: string;
  projectName: string;
  moduleName: string;
  isSelected: boolean;
  onSelect: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => void;
}) {
  const avgProgress = computeItemsProgress(feature.items);
  const progressColor = getProgressColor(avgProgress);
  const hasNetwork = hasCollaborators(feature.items);

  return (
    <button
      onClick={() =>
        onSelect(personName, domainName, projectName, moduleName, feature.name)
      }
      className="w-full flex items-center gap-2 pl-2 pr-2 py-1 rounded transition-all"
      style={{
        background: isSelected ? "var(--notion-bg-secondary)" : "transparent",
        marginLeft: "-2px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = "var(--notion-bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = isSelected
            ? "var(--notion-bg-secondary)"
            : "transparent";
      }}
    >
      <span
        className="flex-1 text-left text-[11px] truncate"
        style={{
          color: isSelected
            ? "var(--notion-text)"
            : "var(--notion-text-secondary)",
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {feature.name}
      </span>

      {hasNetwork && <NetworkIndicator size="xs" />}

      <div
        className="w-6 h-1 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${avgProgress}%`, background: progressColor }}
        />
      </div>

      <span
        className="text-[10px] font-bold w-6 text-right flex-shrink-0"
        style={{ color: progressColor }}
      >
        {avgProgress}%
      </span>
    </button>
  );
}
