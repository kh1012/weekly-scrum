"use client";

import type { ModuleNode } from "./types";
import { computeModuleMetrics } from "./metricsUtils";
import { getProgressColor, getProgressBgColor, getRiskColor } from "./MetricsIndicator";

interface ModuleListProps {
  modules: ModuleNode[];
  selectedModule: string | null;
  onSelectModule: (moduleName: string) => void;
}

export function ModuleList({
  modules,
  selectedModule,
  onSelectModule,
}: ModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: "var(--notion-text-muted)" }}>
        모듈이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {modules.map((module) => {
        const isSelected = selectedModule === module.name;
        const featureCount = module.features.length;
        const metrics = computeModuleMetrics(module);
        const progressColor = getProgressColor(metrics.progress);
        const riskColors = getRiskColor(metrics.riskLevel);

        return (
          <button
            key={module.name}
            onClick={() => onSelectModule(module.name)}
            className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
              isSelected ? "" : "hover:scale-[1.02]"
            }`}
            style={{
              background: isSelected
                ? "var(--notion-bg-active)"
                : "var(--notion-bg-secondary)",
              boxShadow: isSelected
                ? `inset 0 0 0 2px ${progressColor}`
                : "none",
              borderLeft: `4px solid ${progressColor}`,
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="font-semibold"
                style={{ color: isSelected ? "var(--notion-text)" : "var(--notion-text-secondary)" }}
              >
                {module.name}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: getProgressBgColor(metrics.progress),
                  color: progressColor,
                }}
              >
                {metrics.progress}%
              </span>
            </div>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: "var(--notion-text-muted)" }}>
                {featureCount} features
              </span>
              <span
                className="px-1.5 py-0.5 rounded border"
                style={{
                  background: riskColors.bg,
                  color: riskColors.text,
                  borderColor: riskColors.border,
                }}
              >
                {metrics.riskLevel === null ? "No Risk" : `R${metrics.riskLevel}`}
              </span>
            </div>

            {/* 진행률 바 */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--notion-bg)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${metrics.progress}%`,
                  background: progressColor,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
