"use client";

import type { ScrumItem } from "@/types/scrum";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";
import { getProgressColor } from "./MetricsIndicator";

interface SnapshotListProps {
  items: ScrumItem[];
}

export function SnapshotList({ items }: SnapshotListProps) {
  if (items.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm"
        style={{ color: "var(--notion-text-muted)" }}
      >
        스냅샷이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const progressColor = getProgressColor(item.progressPercent);

        return (
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
                <span style={{ color: progressColor }}>{item.progressPercent}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--notion-bg)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.progressPercent}%`,
                    background: progressColor,
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
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">{p}</span>
                  </li>
                ))}
                {item.progress.length > 3 && (
                  <li className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                    +{item.progress.length - 3} more...
                  </li>
                )}
              </ul>
            </div>

            {/* Next */}
            {item.next.length > 0 && (
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
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                      <span className="break-words">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk */}
            {item.risk && item.risk.length > 0 && (
              <div className="mb-3">
                <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
                  리스크
                </div>
                <ul className="space-y-1">
                  {item.risk.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: "#ef4444" }}
                    >
                      <span className="mt-0.5 flex-shrink-0">⚠</span>
                      <span className="break-words">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
        );
      })}
    </div>
  );
}

