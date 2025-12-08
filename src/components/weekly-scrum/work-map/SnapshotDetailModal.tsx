"use client";

import type { ScrumItem } from "@/types/scrum";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";

interface SnapshotDetailModalProps {
  item: ScrumItem;
  onClose: () => void;
}

export function SnapshotDetailModal({ item, onClose }: SnapshotDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ background: "var(--notion-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="sticky top-0 px-4 py-3 border-b flex items-center justify-between"
          style={{
            background: "var(--notion-bg)",
            borderColor: "var(--notion-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold" style={{ color: "var(--notion-text)" }}>
              {item.name}
            </span>
            <DomainBadge domain={item.domain} />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-opacity-50"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-4">
          {/* 경로 정보 */}
          <div
            className="px-3 py-2 rounded text-sm"
            style={{ background: "var(--notion-bg-secondary)" }}
          >
            <span style={{ color: "var(--notion-text-muted)" }}>
              {item.project} / {item.module || "—"} / {item.topic}
            </span>
          </div>

          {/* Plan */}
          <div>
            <div
              className="text-xs font-medium mb-1.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              Plan
            </div>
            <p className="text-sm" style={{ color: "var(--notion-text)" }}>
              {item.plan}
            </p>
          </div>

          {/* Progress */}
          <div>
            <div
              className="text-xs font-medium mb-1.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              Progress ({item.progressPercent}%)
            </div>
            <ul className="space-y-1 pl-4">
              {item.progress.map((p, i) => (
                <li
                  key={i}
                  className="text-sm list-disc"
                  style={{ color: "var(--notion-text-secondary)" }}
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Next */}
          <div>
            <div
              className="text-xs font-medium mb-1.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              Next
            </div>
            <ul className="space-y-1 pl-4">
              {item.next.map((n, i) => (
                <li
                  key={i}
                  className="text-sm list-disc"
                  style={{ color: "var(--notion-text-secondary)" }}
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk */}
          {item.risk && item.risk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  Risk
                </span>
                {item.riskLevel !== null && <RiskLevelBadge level={item.riskLevel} />}
              </div>
              <ul className="space-y-1 pl-4">
                {item.risk.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm list-disc"
                    style={{ color: "var(--notion-danger)" }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collaborators */}
          {item.collaborators && item.collaborators.length > 0 && (
            <div>
              <div
                className="text-xs font-medium mb-1.5"
                style={{ color: "var(--notion-text-muted)" }}
              >
                Collaborators
              </div>
              <div className="flex flex-wrap gap-2">
                {item.collaborators.map((collab, i) => (
                  <span
                    key={i}
                    className="text-sm px-2 py-1 rounded"
                    style={{
                      background:
                        collab.relation === "pair"
                          ? "var(--notion-accent-light)"
                          : collab.relation === "pre"
                          ? "var(--notion-warning-light)"
                          : "var(--notion-success-light)",
                      color:
                        collab.relation === "pair"
                          ? "var(--notion-accent)"
                          : collab.relation === "pre"
                          ? "var(--notion-warning)"
                          : "var(--notion-success)",
                    }}
                  >
                    {collab.name} ({collab.relation})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

