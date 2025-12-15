"use client";

/**
 * 주차 메타데이터 요약 패널
 * - 기본: 하단에 Mini Bar로 표시
 * - 확장 시: 중앙 하단에서 scale 애니메이션으로 확장 (Airbnb 스타일)
 */

import { useEffect, useState } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 확장 시 애니메이션 트리거
  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
      // 다음 프레임에서 애니메이션 시작
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // 애니메이션 종료 후 렌더링 해제
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

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
    <>
      {/* Mini Bar - 접힌 상태 */}
      {!isExpanded && (
        <button
          onClick={onToggle}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-5 py-3 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
        >
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
          
          {/* 확장 아이콘 */}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* 확장된 패널 - Airbnb 스타일 팝업 */}
      {shouldRender && (
        <>
          {/* 백드롭 */}
          <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={onToggle}
          />
          
          {/* 패널 - 중앙 하단에서 scale 애니메이션 */}
          <div 
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-xl transition-all duration-300 ease-out ${
              isAnimating 
                ? "opacity-100 scale-100 translate-y-0" 
                : "opacity-0 scale-90 translate-y-4"
            }`}
            style={{
              transformOrigin: "center bottom",
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">주차 요약</h3>
                    <p className="text-xs text-gray-500">스냅샷 {snapshotCount}개의 통계</p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
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
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-emerald-800">평균 진행률</span>
                        <span className="text-2xl font-black text-emerald-600">
                          {stats.avgProgress !== null ? `${stats.avgProgress}%` : "-"}
                        </span>
                      </div>
                      {stats.avgProgress !== null && (
                        <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${stats.avgProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 도메인 분포 */}
                    {Object.keys(stats.domainDistribution).length > 0 && (
                      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span>🏷️</span>
                          도메인 분포
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(stats.domainDistribution).map(([domain, count]) => {
                            const total = stats.totalEntries || Object.values(stats.domainDistribution).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={domain} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 w-24 truncate">{domain}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-16 text-right">{count}건 ({percentage}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-sm text-gray-500">스냅샷 {snapshotCount}개</p>
                    <p className="text-xs text-gray-400 mt-1">통계 데이터가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
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
    <div className={`p-4 rounded-xl border ${colorClasses[color]} text-center transition-transform hover:scale-105`}>
      {icon && <span className="text-xl mb-1 block">{icon}</span>}
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-0.5">{label}</div>
    </div>
  );
}
