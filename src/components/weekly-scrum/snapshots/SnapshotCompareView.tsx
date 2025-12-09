"use client";

import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import { getDomainColor } from "@/lib/colorDefines";

interface SnapshotCompareViewProps {
  items: ScrumItem[];
  onClose: () => void;
}

export function SnapshotCompareView({ items, onClose }: SnapshotCompareViewProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h2 className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
            스냅샷 비교
          </h2>
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {items.length}개 비교 중
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: "var(--notion-bg-secondary)",
            color: "var(--notion-text-muted)",
          }}
        >
          닫기
        </button>
      </div>

      {/* 비교 그리드 */}
      <div
        className="overflow-x-auto rounded-xl"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <div className="min-w-max p-4">
          <div className="flex gap-4">
            {items.map((item, index) => (
              <CompareCard key={`compare-${index}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* 비교 테이블 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--notion-bg-secondary)" }}>
              <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--notion-text-muted)" }}>
                항목
              </th>
              {items.map((item, index) => (
                <th
                  key={index}
                  className="px-4 py-2 text-left font-medium"
                  style={{ color: "var(--notion-text)" }}
                >
                  {item.name} - {item.topic.slice(0, 15)}
                  {item.topic.length > 15 ? "..." : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="담당자" items={items} getValue={(item) => item.name} />
            <CompareRow label="도메인" items={items} getValue={(item) => item.domain} />
            <CompareRow label="프로젝트" items={items} getValue={(item) => item.project} />
            <CompareRow label="모듈" items={items} getValue={(item) => item.module || "-"} />
            <CompareRow label="피쳐" items={items} getValue={(item) => item.topic} />
            <CompareRow
              label="진행률"
              items={items}
              getValue={(item) => `${item.progressPercent}%`}
              isNumeric
            />
            <CompareRow
              label="리스크"
              items={items}
              getValue={(item) =>
                item.riskLevel !== null ? `Level ${item.riskLevel}` : "미정"
              }
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareCard({ item }: { item: ScrumItem }) {
  const domainColor = getDomainColor(item.domain);
  const riskLevel = item.riskLevel ?? 0;

  return (
    <div
      className="w-80 flex-shrink-0 p-4 rounded-lg"
      style={{
        background: "var(--notion-bg-secondary)",
        border: "1px solid var(--notion-border)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            {riskLevel > 0 && (
              <RiskLevelBadge level={riskLevel as RiskLevel} size="sm" />
            )}
          </div>
          <h3 className="text-sm font-semibold truncate" style={{ color: "var(--notion-text)" }}>
            {item.topic}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--notion-text-muted)" }}>
            {item.name} · {item.project}
          </p>
        </div>
        <CircularProgress percent={item.progressPercent} isCompleted={item.progressPercent >= 100} />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <ContentSection label="Progress" items={item.progress} color="#22c55e" />
        <ContentSection label="Next" items={item.next} color="#3b82f6" />
        {item.risk && item.risk.length > 0 && (
          <ContentSection label="Risk" items={item.risk} color="#ef4444" />
        )}
      </div>
    </div>
  );
}

function ContentSection({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="text-xs">
      <div className="font-medium mb-1" style={{ color }}>
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1" style={{ color: "var(--notion-text)" }}>
            <span style={{ color }} className="text-[8px] mt-1">
              •
            </span>
            <span className="line-clamp-2">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareRow({
  label,
  items,
  getValue,
  isNumeric = false,
}: {
  label: string;
  items: ScrumItem[];
  getValue: (item: ScrumItem) => string;
  isNumeric?: boolean;
}) {
  return (
    <tr style={{ borderTop: "1px solid var(--notion-border)" }}>
      <td className="px-4 py-2 font-medium" style={{ color: "var(--notion-text-muted)" }}>
        {label}
      </td>
      {items.map((item, index) => (
        <td
          key={index}
          className={`px-4 py-2 ${isNumeric ? "font-mono" : ""}`}
          style={{ color: "var(--notion-text)" }}
        >
          {getValue(item)}
        </td>
      ))}
    </tr>
  );
}

