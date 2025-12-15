"use client";

/**
 * Plain Text 미리보기 패널
 * 현재 편집 중인 스냅샷을 구조화된 형식으로 보여줍니다.
 * 편집폼 포커스와 연동하여 해당 섹션을 하이라이트합니다.
 */

import { useEffect, useRef } from "react";
import type { TempSnapshot } from "./types";
import { tempSnapshotToPlainText } from "./types";

// 섹션 타입 정의
export type PreviewSection = 
  | "meta" 
  | "pastWeek" 
  | "pastWeek.tasks" 
  | "pastWeek.risks" 
  | "pastWeek.riskLevel" 
  | "pastWeek.collaborators" 
  | "thisWeek" 
  | "thisWeek.tasks";

interface PlainTextPreviewProps {
  snapshot: TempSnapshot | null;
  onCopy?: () => void;
  focusedSection?: PreviewSection | null;
}

export function PlainTextPreview({ snapshot, onCopy, focusedSection }: PlainTextPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 포커스된 섹션으로 스크롤
  useEffect(() => {
    if (focusedSection && sectionRefs.current[focusedSection]) {
      const element = sectionRefs.current[focusedSection];
      if (element && containerRef.current) {
        // 이미 화면에 보이는지 확인
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const isVisible = 
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;

        if (!isVisible) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [focusedSection]);

  if (!snapshot) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">스냅샷을 선택하면</p>
          <p className="text-gray-300 text-xs mt-1">미리보기가 표시됩니다</p>
        </div>
      </div>
    );
  }

  const plainText = tempSnapshotToPlainText(snapshot);

  // 하이라이트 스타일
  const getHighlightClass = (section: PreviewSection) => {
    if (focusedSection === section) {
      return "bg-blue-50 border-l-2 border-blue-500 -ml-2 pl-2 transition-all duration-300";
    }
    return "transition-all duration-300";
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 - h-12 통일 */}
      <div className="h-12 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">미리보기</span>
          {focusedSection && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full animate-pulse">
              {focusedSection}
            </span>
          )}
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            복사
          </button>
        )}
      </div>

      {/* 콘텐츠 - 독립 스크롤 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-4">
          {/* 메타 정보 섹션 */}
          <div
            ref={(el) => { sectionRefs.current["meta"] = el; }}
            className={`rounded-lg p-3 ${getHighlightClass("meta")}`}
          >
            <div className="text-xs font-mono text-gray-500 mb-2">
              [{snapshot.domain} / {snapshot.project} / {snapshot.module} / {snapshot.feature}]
            </div>
            <div className="text-xs font-mono text-gray-700">
              * Name: {snapshot.name || "(이름 없음)"}
            </div>
          </div>

          {/* Past Week 섹션 */}
          <div
            ref={(el) => { sectionRefs.current["pastWeek"] = el; }}
            className={`rounded-lg p-3 ${getHighlightClass("pastWeek")}`}
          >
            <div className="text-xs font-mono font-semibold text-gray-900 mb-2">* Past Week</div>
            
            {/* Tasks */}
            <div
              ref={(el) => { sectionRefs.current["pastWeek.tasks"] = el; }}
              className={`ml-4 rounded p-2 ${getHighlightClass("pastWeek.tasks")}`}
            >
              <div className="text-xs font-mono text-gray-700">* Tasks</div>
              {snapshot.pastWeek.tasks.length > 0 ? (
                snapshot.pastWeek.tasks.map((task, i) => (
                  <div key={i} className="text-xs font-mono text-gray-600 ml-8">
                    * {task.title} ({task.progress}%)
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-gray-400 ml-8 italic">(작업 없음)</div>
              )}
            </div>

            {/* Risks */}
            <div
              ref={(el) => { sectionRefs.current["pastWeek.risks"] = el; }}
              className={`ml-4 rounded p-2 ${getHighlightClass("pastWeek.risks")}`}
            >
              <div className="text-xs font-mono text-gray-700">
                * Risks{snapshot.pastWeek.risk === null ? ": None" : ""}
              </div>
              {snapshot.pastWeek.risk && snapshot.pastWeek.risk.length > 0 && (
                snapshot.pastWeek.risk.map((r, i) => (
                  <div key={i} className="text-xs font-mono text-gray-600 ml-8">
                    * {r}
                  </div>
                ))
              )}
            </div>

            {/* RiskLevel */}
            <div
              ref={(el) => { sectionRefs.current["pastWeek.riskLevel"] = el; }}
              className={`ml-4 rounded p-2 ${getHighlightClass("pastWeek.riskLevel")}`}
            >
              <div className="text-xs font-mono text-gray-700">
                * RiskLevel: {snapshot.pastWeek.riskLevel ?? "None"}
              </div>
            </div>

            {/* Collaborators */}
            <div
              ref={(el) => { sectionRefs.current["pastWeek.collaborators"] = el; }}
              className={`ml-4 rounded p-2 ${getHighlightClass("pastWeek.collaborators")}`}
            >
              <div className="text-xs font-mono text-gray-700">
                * Collaborators{snapshot.pastWeek.collaborators.length === 0 ? ": None" : ""}
              </div>
              {snapshot.pastWeek.collaborators.length > 0 && (
                snapshot.pastWeek.collaborators.map((c, i) => (
                  <div key={i} className="text-xs font-mono text-gray-600 ml-8">
                    * {c.name} ({(c.relations || []).join(", ")})
                  </div>
                ))
              )}
            </div>
          </div>

          {/* This Week 섹션 */}
          <div
            ref={(el) => { sectionRefs.current["thisWeek"] = el; }}
            className={`rounded-lg p-3 ${getHighlightClass("thisWeek")}`}
          >
            <div className="text-xs font-mono font-semibold text-gray-900 mb-2">* This Week</div>
            
            <div
              ref={(el) => { sectionRefs.current["thisWeek.tasks"] = el; }}
              className={`ml-4 rounded p-2 ${getHighlightClass("thisWeek.tasks")}`}
            >
              <div className="text-xs font-mono text-gray-700">* Tasks</div>
              {snapshot.thisWeek.tasks.length > 0 ? (
                snapshot.thisWeek.tasks.map((task, i) => (
                  <div key={i} className="text-xs font-mono text-gray-600 ml-8">
                    * {task}
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-gray-400 ml-8 italic">(작업 없음)</div>
              )}
            </div>
          </div>
        </div>

        {/* 원본 Plain Text (접기 가능) */}
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            원본 Plain Text 보기
          </summary>
          <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white rounded-xl p-4 border border-gray-200 shadow-sm leading-relaxed">
            {plainText}
          </pre>
        </details>
      </div>
    </div>
  );
}
