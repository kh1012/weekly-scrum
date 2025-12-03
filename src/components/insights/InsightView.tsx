"use client";

import { useInsightContext } from "@/context/InsightContext";
import { InsightDashboard } from "./InsightDashboard";

export function InsightView() {
  const { currentInsight, currentRange } = useInsightContext();

  if (!currentInsight) {
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#1f2328] mb-2">
          인사이트 데이터 없음
        </h3>
        <p className="text-sm text-[#656d76] max-w-md">
          선택한 기간에 대한 인사이트 데이터가 없습니다.
          <br />
          데이터를 생성하려면 insight:parse 스크립트를 실행해주세요.
        </p>
      </div>
    );
  }

  return <InsightDashboard data={currentInsight} range={currentRange} />;
}


