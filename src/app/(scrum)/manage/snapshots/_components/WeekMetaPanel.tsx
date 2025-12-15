"use client";

/**
 * 주차 메타데이터 요약 패널
 * - 기본: 하단에 Mini Bar로 표시
 * - 확장 시: 그 자리에서 위로 확장 (인라인 확장)
 */

import { useEffect } from "react";
import type { WeekStatsData } from "./SnapshotsMainView";

interface WeekMetaPanelProps {
  stats: WeekStatsData | null;
  isExpanded: boolean;
  onToggle: () => void;
  snapshotCount: number;
}

export function WeekMetaPanel({
  stats,
  isExpanded,
  onToggle,
  snapshotCount,
}: WeekMetaPanelProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggle();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, onToggle]);

  return (
    <div 
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isExpanded 
          ? "w-[90%] max-w-2xl" 
          : "w-auto"
      }`}
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
          isExpanded ? "shadow-2xl" : "hover:shadow-xl"
        }`}
      >
        {/* 헤더 바 (항상 표시, 클릭하면 토글) */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${
            isExpanded 
              ? "bg-gradient-to-r from-slate-50 to-white border-b border-gray-100" 
              : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-4">
            {/* 스냅샷 수 */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{snapshotCount}</span>
              <span className="text-xs text-gray-500">스냅샷</span>
            </div>
            
            <div className="w-px h-4 bg-gray-200" />
            
            {/* 프로젝트/모듈/기능 수 */}
            {stats && (
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{stats.projectCount} 프로젝트</span>
                <span>{stats.moduleCount} 모듈</span>
                <span>{stats.featureCount} 기능</span>
              </div>
            )}
            
            {stats?.avgProgress !== null && stats?.avgProgress !== undefined && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                
                {/* 진행률 */}
                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      style={{ width: `${stats.avgProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-emerald-600">{stats.avgProgress}%</span>
                </div>
              </>
            )}
          </div>
          
          {/* 확장/축소 아이콘 */}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* 확장된 콘텐츠 */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 py-4 space-y-4">
            {stats ? (
              <>
                {/* 메인 통계 그리드 */}
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="스냅샷" value={snapshotCount} color="blue" icon="📝" />
                  <StatCard label="프로젝트" value={stats.projectCount} color="purple" icon="📁" />
                  <StatCard label="모듈" value={stats.moduleCount} color="emerald" icon="📦" />
                  <StatCard label="기능" value={stats.featureCount} color="amber" icon="✨" />
                </div>

                {/* 평균 진행률 */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-emerald-800">평균 진행률</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {stats.avgProgress !== null ? `${stats.avgProgress}%` : "-"}
                    </span>
                  </div>
                  {stats.avgProgress !== null && (
                    <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${stats.avgProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 도메인 분포 */}
                {Object.keys(stats.domainDistribution).length > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                      <span>🏷️</span>
                      도메인 분포
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(stats.domainDistribution).map(([domain, count]) => {
                        const total = stats.totalEntries || Object.values(stats.domainDistribution).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={domain} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-600 w-20 truncate">{domain}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 w-12 text-right">{count}건</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">스냅샷 {snapshotCount}개</p>
                <p className="text-xs text-gray-400 mt-1">통계 데이터가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 통계 카드
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "emerald" | "amber";
  icon?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className={`p-3 rounded-xl border ${colorClasses[color]} text-center`}>
      {icon && <span className="text-base mb-0.5 block">{icon}</span>}
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] opacity-75">{label}</div>
    </div>
  );
}
