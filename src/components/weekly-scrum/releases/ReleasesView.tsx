"use client";

import { useState } from "react";
import type { Release } from "./types";
import { CHANGE_TYPE_LABELS } from "./types";
import { RELEASES } from "./releaseData";

export function ReleasesView() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set([RELEASES[0]?.version]) // 최신 버전은 기본 확장
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📝</span>
          <h1 className="text-xl font-bold" style={{ color: "var(--notion-text)" }}>
            릴리즈 노트
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
          Weekly Scrum 서비스의 주요 업데이트 내역입니다.
        </p>
      </div>

      {/* 릴리즈 목록 */}
      <div className="space-y-4">
        {RELEASES.map((release) => (
          <ReleaseCard
            key={release.version}
            release={release}
            isExpanded={expandedVersions.has(release.version)}
            onToggle={() => toggleVersion(release.version)}
          />
        ))}
      </div>
    </div>
  );
}

interface ReleaseCardProps {
  release: Release;
  isExpanded: boolean;
  onToggle: () => void;
}

function ReleaseCard({ release, isExpanded, onToggle }: ReleaseCardProps) {
  const isLatest = RELEASES[0]?.version === release.version;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--notion-bg)",
        border: "1px solid var(--notion-border)",
      }}
    >
      {/* 헤더 (클릭 가능) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50 text-left"
      >
        <div className="flex items-center gap-3">
          {/* 버전 뱃지 */}
          <span
            className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
            style={{
              background: isLatest ? "rgba(59, 130, 246, 0.15)" : "var(--notion-bg-secondary)",
              color: isLatest ? "#3b82f6" : "var(--notion-text-muted)",
            }}
          >
            v{release.version}
          </span>

          {/* 제목 */}
          <span className="font-medium text-sm" style={{ color: "var(--notion-text)" }}>
            {release.title}
          </span>

          {/* 최신 뱃지 */}
          {isLatest && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
            >
              Latest
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 날짜 */}
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {release.date}
          </span>

          {/* 확장 아이콘 */}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--notion-border)" }}>
          {/* 요약 */}
          <p className="text-xs mt-3 mb-4" style={{ color: "var(--notion-text-secondary)" }}>
            {release.summary}
          </p>

          {/* 변경사항 */}
          <div className="space-y-2">
            {release.changes.map((change, index) => {
              const typeInfo = CHANGE_TYPE_LABELS[change.type];
              return (
                <div key={index} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5"
                    style={{ background: typeInfo.bg, color: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--notion-text)" }}>
                    {change.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

