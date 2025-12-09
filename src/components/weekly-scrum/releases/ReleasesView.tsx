"use client";

import { useState, useRef, useEffect } from "react";
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
      <div className="mb-8 animate-slide-in-left">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
            }}
          >
            📝
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--notion-text)", letterSpacing: "-0.02em" }}
            >
              릴리즈 노트
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--notion-text-muted)" }}>
              Weekly Scrum 서비스의 주요 업데이트 내역
            </p>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="relative">
        {/* 타임라인 선 */}
        <div
          className="absolute left-6 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, #3b82f6, transparent)" }}
        />

        {/* 릴리즈 목록 */}
        <div className="space-y-6">
          {RELEASES.map((release, index) => (
            <ReleaseCard
              key={release.version}
              release={release}
              isExpanded={expandedVersions.has(release.version)}
              onToggle={() => toggleVersion(release.version)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReleaseCardProps {
  release: Release;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function ReleaseCard({ release, isExpanded, onToggle, index }: ReleaseCardProps) {
  const isLatest = RELEASES[0]?.version === release.version;
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // 콘텐츠 높이 계산
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [release.changes, release.summary]);

  return (
    <div
      className="relative pl-14 animate-slide-in-left"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* 타임라인 노드 */}
      <div
        className="absolute left-4 top-4 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: isLatest
            ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
            : isExpanded
            ? "#3b82f6"
            : "var(--notion-bg-secondary)",
          border: isLatest ? "none" : "2px solid var(--notion-border)",
          boxShadow: isLatest ? "0 2px 8px rgba(59, 130, 246, 0.4)" : "none",
        }}
      >
        {isLatest && (
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
      </div>

      {/* 카드 */}
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 interactive-card"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
          boxShadow: isExpanded
            ? "0 8px 30px rgba(0, 0, 0, 0.08)"
            : "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* 헤더 (클릭 가능) */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 text-left group"
          style={{
            background: isExpanded ? "rgba(59, 130, 246, 0.02)" : "transparent",
          }}
        >
          <div className="flex items-center gap-3">
            {/* 버전 뱃지 */}
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200"
              style={{
                background: isLatest
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))"
                  : "var(--notion-bg-secondary)",
                color: isLatest ? "#3b82f6" : "var(--notion-text-muted)",
              }}
            >
              v{release.version}
            </span>

            {/* 제목 */}
            <span
              className="font-semibold text-sm transition-colors duration-200"
              style={{ color: "var(--notion-text)" }}
            >
              {release.title}
            </span>

            {/* 최신 뱃지 */}
            {isLatest && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))",
                  color: "#22c55e",
                }}
              >
                Latest
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* 변경사항 개수 */}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)",
              }}
            >
              {release.changes.length}개 변경
            </span>

            {/* 날짜 */}
            <span
              className="text-xs font-medium"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {release.date}
            </span>

            {/* 확장 아이콘 */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                background: isExpanded ? "rgba(59, 130, 246, 0.1)" : "var(--notion-bg-secondary)",
              }}
            >
              <svg
                className="w-4 h-4 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  color: isExpanded ? "#3b82f6" : "var(--notion-text-muted)",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* 상세 내용 (애니메이션) */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? `${contentHeight + 40}px` : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div
            ref={contentRef}
            className="px-5 pb-5 border-t"
            style={{ borderColor: "var(--notion-border)" }}
          >
            {/* 요약 */}
            <p
              className="text-sm mt-4 mb-5 leading-relaxed"
              style={{ color: "var(--notion-text-secondary)" }}
            >
              {release.summary}
            </p>

            {/* 변경사항 */}
            <div className="space-y-2.5">
              {release.changes.map((change, changeIndex) => {
                const typeInfo = CHANGE_TYPE_LABELS[change.type];
                return (
                  <div
                    key={changeIndex}
                    className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group/item"
                    style={{
                      background: "var(--notion-bg-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.04)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--notion-bg-secondary)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      className="flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: typeInfo.bg, color: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--notion-text)" }}
                    >
                      {change.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
