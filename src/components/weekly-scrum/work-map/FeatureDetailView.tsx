"use client";

import type { FeatureNode } from "./types";
import { computeFeatureMetrics } from "./metricsUtils";
import { getProgressColor, getRiskColor } from "./MetricsIndicator";
import { CollaborationNetworkV2 } from "./CollaborationNetworkV2";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";

interface FeatureDetailViewProps {
  projectName: string;
  moduleName: string;
  feature: FeatureNode;
  onBack: () => void;
}

export function FeatureDetailView({
  projectName,
  moduleName,
  feature,
  onBack,
}: FeatureDetailViewProps) {
  const metrics = computeFeatureMetrics(feature);
  const progressColor = getProgressColor(metrics.progress);
  const riskColors = getRiskColor(metrics.riskLevel);
  const memberCount = new Set(feature.items.map((i) => i.name)).size;
  const hasCollaborators = feature.items.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );

  return (
    <div className="h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* 헤더 */}
      <div className="flex-shrink-0 mb-6">
        {/* 뒤로가기 + 경로 */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium">Work Map</span>
          </button>
          <span style={{ color: "var(--notion-text-muted)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
            {projectName}
          </span>
          <span style={{ color: "var(--notion-text-muted)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
            {moduleName}
          </span>
          <span style={{ color: "var(--notion-text-muted)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
            {feature.name}
          </span>
        </div>

        {/* Feature 제목 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--notion-text)" }}>
              {feature.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {/* 진행률 */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: `${progressColor}15` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: progressColor }}
                />
                <span className="text-sm font-bold" style={{ color: progressColor }}>
                  {metrics.progress}% 완료
                </span>
              </div>

              {/* 리스크 */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: riskColors.bg }}
              >
                <span className="text-sm font-medium" style={{ color: riskColors.text }}>
                  {metrics.riskLevel === null ? "No Risk" : `Risk Level ${metrics.riskLevel}`}
                </span>
              </div>

              {/* 멤버 수 */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "var(--notion-bg-secondary)" }}
              >
                <span className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  {memberCount}명 참여
                </span>
              </div>

              {/* 스냅샷 수 */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "var(--notion-bg-secondary)" }}
              >
                <span className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  {feature.items.length} snapshots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 협업 네트워크 */}
        {hasCollaborators && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "var(--notion-border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--notion-text)" }}>
                Collaboration Network
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
                협업 관계를 시각화합니다. 노드를 클릭하면 상세 정보를 볼 수 있습니다.
              </p>
            </div>
            <div className="p-4">
              <CollaborationNetworkV2 items={feature.items} />
            </div>
          </div>
        )}

        {/* 스냅샷 목록 */}
        <div
          className={`rounded-xl overflow-hidden ${!hasCollaborators ? "lg:col-span-2" : ""}`}
          style={{
            background: "var(--notion-bg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <h2 className="font-semibold" style={{ color: "var(--notion-text)" }}>
              Snapshots
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
              이 피쳐에 대한 모든 스냅샷 기록입니다.
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {feature.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="p-4 rounded-lg"
                style={{ background: "var(--notion-bg-secondary)" }}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--notion-text)" }}>
                      {item.name}
                    </span>
                    <DomainBadge domain={item.domain} />
                  </div>
                  {item.riskLevel !== null && item.riskLevel > 0 && (
                    <RiskLevelBadge level={item.riskLevel} />
                  )}
                </div>

                {/* 진행률 바 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--notion-text-muted)" }}>Progress</span>
                    <span style={{ color: getProgressColor(item.progressPercent) }}>
                      {item.progressPercent}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--notion-bg)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.progressPercent}%`,
                        background: getProgressColor(item.progressPercent),
                      }}
                    />
                  </div>
                </div>

                {/* Progress 내용 */}
                <div className="mb-3">
                  <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
                    완료된 작업
                  </div>
                  <ul className="space-y-1">
                    {item.progress.slice(0, 3).map((p, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                        style={{ color: "var(--notion-text-secondary)" }}
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                    {item.progress.length > 3 && (
                      <li
                        className="text-xs"
                        style={{ color: "var(--notion-text-muted)" }}
                      >
                        +{item.progress.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Next */}
                <div className="mb-3">
                  <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
                    다음 계획
                  </div>
                  <ul className="space-y-1">
                    {item.next.slice(0, 2).map((n, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                        style={{ color: "var(--notion-text-secondary)" }}
                      >
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Collaborators */}
                {item.collaborators && item.collaborators.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: "var(--notion-border)" }}>
                    {item.collaborators.map((collab, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background:
                            collab.relation === "pair"
                              ? "rgba(59, 130, 246, 0.15)"
                              : collab.relation === "pre"
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(34, 197, 94, 0.15)",
                          color:
                            collab.relation === "pair"
                              ? "#3b82f6"
                              : collab.relation === "pre"
                              ? "#f59e0b"
                              : "#22c55e",
                        }}
                      >
                        {collab.name} ({collab.relation})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

