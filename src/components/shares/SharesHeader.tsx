"use client";

import Link from "next/link";
import { SharesWeekSelector } from "./SharesWeekSelector";

export function SharesHeader() {
  return (
    <header className="glass-effect sticky top-0 z-40 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 로고 및 제목 */}
          <div className="flex items-center gap-4">
            <Link href="/weekly-scrum" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-[#1f2328]">
                Shares
              </span>
            </Link>
            <span className="hidden sm:block text-[#d0d7de]">|</span>
            <Link
              href="/weekly-scrum"
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
          <SharesWeekSelector />
        </div>
      </div>
    </header>
  );
}
