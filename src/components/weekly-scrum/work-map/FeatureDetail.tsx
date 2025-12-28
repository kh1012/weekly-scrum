"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";
import { CollaborationNetwork } from "./CollaborationNetwork";
import { SnapshotDetailModal } from "./SnapshotDetailModal";

interface FeatureDetailProps {
  featureName: string;
  items: ScrumItem[];
}

export function FeatureDetail({ featureName, items }: FeatureDetailProps) {
  const [selectedItem, setSelectedItem] = useState<ScrumItem | null>(null);

  // 협업자가 있는 아이템이 있는지 확인
  const hasCollaborators = items.some(
    (item) => item.collaborators && item.collaborators.length > 0
  );

  if (items.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: "#57606a" }}>
        스냅샷이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature 헤더 */}
      <div className="pb-3 border-b" style={{ borderColor: "#d0d7de" }}>
        <h3 className="text-lg font-semibold" style={{ color: "#24292f" }}>
          {featureName}
        </h3>
        <p className="text-sm mt-1" style={{ color: "#57606a" }}>
          {items.length}개의 스냅샷, {new Set(items.map((i) => i.name)).size}명의 멤버
        </p>
      </div>

      {/* Collaboration Network 섹션 */}
      {hasCollaborators && (
        <div>
          <h4
            className="text-sm font-medium mb-3"
            style={{ color: "#57606a" }}
          >
            Collaboration Network
          </h4>
          <CollaborationNetwork items={items} onNodeClick={setSelectedItem} />
        </div>
      )}

      {/* 스냅샷 목록 */}
      <div>
        <h4
          className="text-sm font-medium mb-3"
          style={{ color: "#57606a" }}
        >
          Snapshots
        </h4>
        <div className="space-y-3">
          {items.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              onClick={() => setSelectedItem(item)}
              className="w-full text-left p-4 rounded-lg transition-all hover:ring-1"
              style={{
                background: "#f6f8fa",
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: "#24292f" }}>
                    {item.name}
                  </span>
                  <DomainBadge domain={item.domain} />
                </div>
                {item.riskLevel !== null && item.riskLevel > 0 && (
                  <RiskLevelBadge level={item.riskLevel} />
                )}
              </div>

              {/* Progress 요약 */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "white" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.progressPercent}%`,
                        background:
                          item.progressPercent >= 80
                            ? "#1a7f37"
                            : item.progressPercent >= 50
                            ? "#0969da"
                            : "#9a6700",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-10 text-right"
                    style={{ color: "#57606a" }}
                  >
                    {item.progressPercent}%
                  </span>
                </div>
                <p
                  className="text-sm truncate"
                  style={{ color: "#57606a" }}
                >
                  {item.progress[0]}
                </p>
              </div>

              {/* Collaborators 미리보기 */}
              {item.collaborators && item.collaborators.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.collaborators.slice(0, 3).map((collab, i) => (
                    <span
                      key={i}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "white",
                        color: "#57606a",
                      }}
                    >
                      {collab.name}
                    </span>
                  ))}
                  {item.collaborators.length > 3 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "white",
                        color: "#57606a",
                      }}
                    >
                      +{item.collaborators.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedItem && (
        <SnapshotDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
