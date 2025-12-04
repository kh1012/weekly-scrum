"use client";

import Link from "next/link";
import { InsightWeekSelector } from "./InsightWeekSelector";

export function InsightHeader() {
  return (
    <header className="glass-effect sticky top-0 z-40 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 로고 및 제목 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <span className="text-lg font-semibold text-[#1f2328]">
                인사이트
              </span>
            </Link>
            <span className="hidden sm:block text-[#d0d7de]">|</span>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm text-[#656d76] hover:text-[#1f2328] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              스크럼으로 돌아가기
            </Link>
          </div>

          {/* 주차 선택기 */}
          <InsightWeekSelector />
        </div>
      </div>
    </header>
  );
}
