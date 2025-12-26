"use client";

import { useState } from "react";

// 카테고리 상수 (임시, STEP 4에서 server에서 가져오기)
const CATEGORIES = ["project", "module", "feature"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  project: "Project",
  module: "Module",
  feature: "Feature",
};

interface MetaOptionsManagerProps {
  workspaceId: string;
}

export function MetaOptionsManager({ workspaceId }: MetaOptionsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("project");

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-3">
            Snapshot{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Meta Options
            </span>
          </h1>
          <p className="text-sm md:text-lg text-gray-500 font-light">
            스냅샷 메타 옵션을 관리하세요
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                  selectedCategory === category
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {/* 메타 옵션 테이블 (TODO: STEP 4에서 구현) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-12 text-gray-500">
            {CATEGORY_LABELS[selectedCategory]} 옵션 목록
            <br />
            <span className="text-sm">(STEP 4에서 구현 예정)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
