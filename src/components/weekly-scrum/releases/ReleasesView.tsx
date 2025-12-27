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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
      {/* 헤더 - GitHub 스타일 */}
      <div className="mb-6 pb-4 border-b border-[#d0d7de]">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-[#57606a]"
            fill="currentColor"
            viewBox="0 0 512 512"
          >
            <path d="M0 80l0 48c0 17.7 14.3 32 32 32l16 0 48 0 0-80c0-26.5-21.5-48-48-48S0 53.5 0 80zM112 32c10 13.4 16 30 16 48l0 304c0 35.3 28.7 64 64 64s64-28.7 64-64l0-5.3c0-32.4 26.3-58.7 58.7-58.7L480 320l0-192c0-53-43-96-96-96L112 32zM464 480c61.9 0 112-50.1 112-112c0-8.8-7.2-16-16-16l-245.3 0c-14.7 0-26.7 11.9-26.7 26.7l0 5.3c0 53-43 96-96 96l176 0 96 0z" />
          </svg>
          <div>
            <h1 className="text-lg font-semibold text-[#24292f]">
              릴리즈 노트
            </h1>
            <p className="text-xs text-[#57606a] mt-0.5">
              Weekly Scrum 서비스의 주요 업데이트 내역
            </p>
          </div>
        </div>
      </div>

      {/* 타임라인 - GitHub 스타일 */}
      <div className="relative">
        {/* 타임라인 선 */}
        <div
          className="absolute left-3 md:left-4 top-0 bottom-0 w-px bg-[#d0d7de]"
        />

        {/* 릴리즈 목록 */}
        <div className="space-y-4">
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
      className="relative pl-10 md:pl-12"
    >
      {/* 타임라인 노드 - GitHub 스타일 */}
      <div
        className="absolute left-3 md:left-4 top-3 w-3 h-3 rounded-full flex items-center justify-center transition-all"
        style={{
          background: isLatest
            ? "#0969da"
            : isExpanded
            ? "#0969da"
            : "#ffffff",
          border: `2px solid ${isLatest ? "#0969da" : "#d0d7de"}`,
        }}
      />

      {/* 카드 - GitHub 스타일 */}
      <div
        className="bg-white border border-[#d0d7de] overflow-hidden transition-all rounded-md"
      >
        {/* 헤더 (클릭 가능) - GitHub 스타일 */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 transition-all text-left group bg-[#f6f8fa] hover:bg-[#eaeef2]"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* 버전 뱃지 */}
            <span
              className="px-2 py-0.5 text-xs font-mono font-semibold shrink-0"
              style={{
                background: isLatest ? "#dafbe1" : "#f6f8fa",
                color: isLatest ? "#1f883d" : "#57606a",
                border: `1px solid ${isLatest ? "#1f883d" : "#d0d7de"}`,
              }}
            >
              v{release.version}
            </span>

            {/* 제목 */}
            <span
              className="font-semibold text-sm text-[#24292f] truncate"
            >
              {release.title}
            </span>

            {/* 최신 뱃지 */}
            {isLatest && (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#1f883d] text-white shrink-0"
              >
                Latest
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* 변경사항 개수 */}
            <span
              className="hidden sm:inline text-xs px-2 py-0.5 bg-white border border-[#d0d7de] text-[#57606a]"
            >
              {release.changes.length}개 변경
            </span>

            {/* 날짜 */}
            <span
              className="text-xs font-medium text-[#57606a]"
            >
              {release.date}
            </span>

            {/* 확장 아이콘 */}
            <svg
              className="w-4 h-4 transition-transform text-[#57606a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* 상세 내용 (애니메이션) - GitHub 스타일 */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? `${contentHeight + 40}px` : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div
            ref={contentRef}
            className="px-4 pb-4 border-t border-[#d0d7de]"
          >
            {/* 요약 */}
            <p
              className="text-sm mt-3 mb-4 leading-relaxed text-[#57606a]"
            >
              {release.summary}
            </p>

            {/* 변경사항 - GitHub 스타일 */}
            <div className="space-y-2">
              {release.changes.map((change, changeIndex) => {
                const typeInfo = CHANGE_TYPE_LABELS[change.type];
                return (
                  <div
                    key={changeIndex}
                    className="flex items-start gap-2 p-2 bg-[#f6f8fa] hover:bg-[#eaeef2] transition-colors"
                  >
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: typeInfo.bg, color: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                    <span
                      className="text-sm leading-relaxed text-[#24292f]"
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
