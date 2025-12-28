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
      <div className="p-4 text-center text-[#57606a]">
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
            className={`w-full text-left px-3 py-3 rounded-md transition-colors ${
              isSelected ? "bg-[#ddf4ff]" : "bg-[#f6f8fa] hover:bg-[#f3f4f6]"
            }`}
            style={{
              boxShadow: isSelected ? `inset 0 0 0 2px ${progressColor}` : "none",
              borderLeft: `4px solid ${progressColor}`,
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`font-semibold ${
                  isSelected ? "text-[#24292f]" : "text-[#57606a]"
                }`}
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
              <span className="text-[#57606a]">
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
            <div className="h-1.5 rounded-full overflow-hidden bg-white">
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
