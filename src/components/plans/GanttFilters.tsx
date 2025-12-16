"use client";

/**
 * GanttFilters - 간트 차트 필터 컴포넌트
 * 
 * 릴리즈, 스프린트, 프로젝트, 모듈, 기능 레벨 필터링
 */

import {
  RocketIcon,
  RefreshIcon,
  FolderIcon,
  CubeIcon,
  CodeIcon,
} from "@/components/common/Icons";
import { ComponentType, SVGProps } from "react";

export interface GanttFilterState {
  release: boolean;
  sprint: boolean;
  project: boolean;
  module: boolean;
  feature: boolean;
}

interface GanttFiltersProps {
  filters: GanttFilterState;
  onChange: (filters: GanttFilterState) => void;
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const FILTER_OPTIONS: { key: keyof GanttFilterState; label: string; Icon: IconComponent; color: string }[] = [
  { key: "release", label: "릴리즈", Icon: RocketIcon, color: "#ec4899" },
  { key: "sprint", label: "스프린트", Icon: RefreshIcon, color: "#f59e0b" },
  { key: "project", label: "프로젝트", Icon: FolderIcon, color: "#8b5cf6" },
  { key: "module", label: "모듈", Icon: CubeIcon, color: "#3b82f6" },
  { key: "feature", label: "기능", Icon: CodeIcon, color: "#10b981" },
];

export function GanttFilters({ filters, onChange }: GanttFiltersProps) {
  const handleToggle = (key: keyof GanttFilterState) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="flex items-center gap-1.5">
      {FILTER_OPTIONS.map((opt) => {
        const isActive = filters[opt.key];
        const { Icon } = opt;
        return (
          <button
            key={opt.key}
            onClick={() => handleToggle(opt.key)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: isActive ? `${opt.color}15` : "var(--notion-bg-secondary)",
              color: isActive ? opt.color : "var(--notion-text-muted)",
              border: isActive ? `1px solid ${opt.color}30` : "1px solid var(--notion-border)",
            }}
          >
            <Icon size={12} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const defaultGanttFilters: GanttFilterState = {
  release: true,
  sprint: true,
  project: true,
  module: true,
  feature: true,
};

