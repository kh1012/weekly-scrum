"use client";

import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import { getDomainColor, getRiskLevelColor, PROGRESS_COLORS } from "@/lib/colorDefines";

interface SnapshotCompareViewProps {
  items: ScrumItem[];
  onClose: () => void;
}

export function SnapshotCompareView({ items, onClose }: SnapshotCompareViewProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 rounded-md bg-white border border-[#d0d7de]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h2 className="font-semibold text-sm text-[#24292f]">
            스냅샷 비교
          </h2>
          <span className="text-xs text-[#57606a]">
            {items.length}개 비교 중
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded text-xs font-medium bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6] transition-colors"
        >
          닫기
        </button>
      </div>

      {/* 비교 그리드 */}
      <div className="overflow-x-auto rounded-md bg-white border border-[#d0d7de]">
        <div className="min-w-max p-4">
          <div className="flex gap-4">
            {items.map((item, index) => (
              <CompareCard key={`compare-${index}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* 비교 테이블 */}
      <div className="rounded-md overflow-hidden bg-white border border-[#d0d7de]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#f6f8fa]">
              <th className="px-4 py-2 text-left font-medium text-[#57606a]">
                항목
              </th>
              {items.map((item, index) => (
                <th
                  key={index}
                  className="px-4 py-2 text-left font-medium text-[#24292f]"
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
  const riskColor = getRiskLevelColor(riskLevel as RiskLevel);

  // risk가 null이면 미정 상태
  const isRiskUnknown = item.risk === null && item.riskLevel === null;

  return (
    <div className="w-80 flex-shrink-0 p-4 rounded-md bg-white border border-[#d0d7de]">
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
          <h3 className="text-sm font-semibold truncate text-[#24292f]">
            {item.topic}
          </h3>
          <p className="text-xs mt-0.5 text-[#57606a]">
            {item.name} · {item.project}
          </p>
        </div>
        <CircularProgress percent={item.progressPercent} isCompleted={item.progressPercent >= 100} />
      </div>

      {/* Progress / Next */}
      <div className="space-y-3">
        {/* Progress (Past Week) */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold" style={{ color: PROGRESS_COLORS.completed.text }}>
              Progress
            </span>
          </div>
          <div className="space-y-1.5 pl-2" style={{ borderLeft: `2px solid ${PROGRESS_COLORS.completed.text}` }}>
            <ContentSection label="Tasks" items={item.progress} />
            {item.risk && item.risk.length > 0 && (
              <ContentSection label="Risk" items={item.risk} color={riskColor.text} />
            )}
            {isRiskUnknown && (
              <div className="text-xs text-[#57606a]">
                <span className="font-medium text-[#8c959f]">Risk: </span>
                <span>미정</span>
              </div>
            )}
          </div>
        </div>

        {/* Next (This Week) */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold text-[#0969da]">
              Next
            </span>
          </div>
          <div className="space-y-1.5 pl-2 border-l-2 border-[#0969da]">
            <ContentSection label="Tasks" items={item.next} />
          </div>
        </div>
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
  color?: string;
}) {
  const textColor = color || "#24292f";
  
  if (!items || items.length === 0) {
    return (
      <div className="text-xs text-[#57606a]">
        <span className="font-medium" style={{ color: textColor }}>{label}: </span>
        <span>-</span>
      </div>
    );
  }

  if (items.length === 1) {
    return (
      <div className="text-xs text-[#24292f]">
        <span className="font-medium" style={{ color: textColor }}>{label}: </span>
        <span>{items[0]}</span>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <span className="font-medium" style={{ color: textColor }}>{label}:</span>
      <ul className="mt-0.5 space-y-0.5 ml-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1 text-[#24292f]">
            <span className="text-[8px] mt-1" style={{ color: textColor }}>•</span>
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
    <tr className="border-t border-[#d0d7de]">
      <td className="px-4 py-2 font-medium text-[#57606a]">
        {label}
      </td>
      {items.map((item, index) => (
        <td
          key={index}
          className={`px-4 py-2 text-[#24292f] ${isNumeric ? "font-mono" : ""}`}
        >
          {getValue(item)}
        </td>
      ))}
    </tr>
  );
}
