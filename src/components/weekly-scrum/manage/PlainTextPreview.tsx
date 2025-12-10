"use client";

/**
 * Plain Text 미리보기 패널
 * 현재 편집 중인 스냅샷을 Plain Text 형식으로 보여줍니다.
 */

import type { TempSnapshot } from "./types";
import { tempSnapshotToPlainText } from "./types";

interface PlainTextPreviewProps {
  snapshot: TempSnapshot | null;
  onCopy?: () => void;
}

export function PlainTextPreview({ snapshot, onCopy }: PlainTextPreviewProps) {
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-800">Plain Text Preview</span>
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
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white rounded-xl p-4 border border-gray-200 shadow-sm leading-relaxed">
          {plainText}
        </pre>
      </div>
    </div>
  );
}

