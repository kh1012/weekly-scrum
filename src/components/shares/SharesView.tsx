"use client";

import { useSharesContext } from "@/context/SharesContext";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function SharesView() {
  const { currentContent } = useSharesContext();

  if (!currentContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-[#f6f8fa] rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#656d76]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#1f2328] mb-2">
          Shares 데이터 없음
        </h3>
        <p className="text-sm text-[#656d76] max-w-md">
          선택한 기간에 대한 Shares 데이터가 없습니다.
          <br />
          <code className="bg-[#f6f8fa] px-1.5 py-0.5 rounded text-xs">
            data/shares/YYYY-MM-WXX.md
          </code>{" "}
          형식으로 마크다운 파일을 생성해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#d0d7de] rounded-lg p-6">
      <MarkdownRenderer content={currentContent} />
    </div>
  );
}

