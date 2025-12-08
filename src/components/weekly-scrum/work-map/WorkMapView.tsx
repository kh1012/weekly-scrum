"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection } from "./types";
import { useWorkMapData } from "./useWorkMapData";
import { DirectoryTree } from "./DirectoryTree";
import { FeatureDetailView } from "./FeatureDetailView";

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

  // 현재 선택된 피쳐
  const selectedFeature =
    selection.project && selection.module && selection.feature
      ? getFeatureByName(selection.project, selection.module, selection.feature)
      : null;

  // 피쳐 선택 핸들러
  const handleFeatureSelect = (project: string, module: string, feature: string) => {
    setSelection({ project, module, feature });
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    setSelection({ project: null, module: null, feature: null });
  };

  // Feature Detail 보기 모드
  if (selectedFeature) {
    return (
      <FeatureDetailView
        projectName={selection.project!}
        moduleName={selection.module!}
        feature={selectedFeature}
        onBack={handleBack}
      />
    );
  }

  // Directory Tree 보기 모드
  return (
    <div className="h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* 헤더 */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            🗺️
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--notion-text)" }}>
              Work Map
            </h1>
            <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
              프로젝트 구조를 탐색하고 피쳐별 상세 정보를 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* 통계 바 */}
      <div
        className="flex-shrink-0 grid grid-cols-4 gap-4 mb-6 p-4 rounded-xl"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        <StatItem label="Projects" value={projects.length} icon="📁" />
        <StatItem
          label="Modules"
          value={projects.reduce((sum, p) => sum + p.modules.length, 0)}
          icon="📂"
        />
        <StatItem
          label="Features"
          value={projects.reduce(
            (sum, p) => sum + p.modules.reduce((s, m) => s + m.features.length, 0),
            0
          )}
          icon="📄"
        />
        <StatItem label="Snapshots" value={items.length} icon="📸" />
      </div>

      {/* 디렉토리 트리 */}
      <div
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <div className="h-full p-4">
          <DirectoryTree projects={projects} onFeatureSelect={handleFeatureSelect} />
        </div>
      </div>
    </div>
  );
}

/**
 * 통계 아이템
 */
function StatItem({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
        style={{ background: "var(--notion-bg)" }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color: "var(--notion-text)" }}>
          {value}
        </div>
        <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
