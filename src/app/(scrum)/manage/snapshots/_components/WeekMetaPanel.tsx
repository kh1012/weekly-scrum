"use client";

/**
 * 주차 메타데이터 요약 패널
 * - 기본: 하단에 Mini Bar로 표시
 * - 확장 시: Bottom Sheet 스타일로 위로 슬라이딩
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

  // 애니메이션 상태 관리
  useEffect(() => {
    if (isExpanded) {
      setIsAnimating(true);
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
      {/* 접힌 상태: 하단 Mini Bar */}
      {!isExpanded && (
        <MiniBar
          stats={stats}
          snapshotCount={snapshotCount}
          onExpand={onToggle}
        />
      )}

      {/* 확장 상태: Bottom Sheet 오버레이 */}
      {isExpanded && (
        <>
          {/* 백드롭 (클릭 시 닫기) */}
          <div 
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={onToggle}
          />
          
          {/* Bottom Sheet 패널 */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ maxHeight: "70%" }}
          >
            <ExpandedPanel
              stats={stats}
              snapshotCount={snapshotCount}
              onCollapse={onToggle}
            />
          </div>
        </>
      )}
    </>
  );
}

// 접힌 상태: 하단 Mini Bar
function MiniBar({
  stats,
  snapshotCount,
  onExpand,
}: {
  stats: WeekStatsData | null;
  snapshotCount: number;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-200 group"
    >
      {/* 핸들 표시 */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      
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
      
      <div className="w-px h-4 bg-gray-200" />
      
      {/* 진행률 */}
      {stats?.avgProgress !== null && stats?.avgProgress !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-emerald-600">{stats.avgProgress}%</span>
        </div>
      )}
      
      {/* 확장 아이콘 */}
      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

// 확장된 상태 - Bottom Sheet 스타일
function ExpandedPanel({
  stats,
  snapshotCount,
  onCollapse,
}: {
  stats: WeekStatsData | null;
  snapshotCount: number;
  onCollapse: () => void;
}) {
  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* 핸들 바 */}
      <div className="flex justify-center pt-3 pb-2">
        <button
          onClick={onCollapse}
          className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
          aria-label="접기"
        />
      </div>

      {/* 헤더 */}
      <div className="shrink-0 px-6 pb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">📊 주차 요약</h3>
        <button
          onClick={onCollapse}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          title="접기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {stats ? (
          <div className="space-y-5">
            {/* 메인 통계 그리드 - 가로 스크롤 가능 */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="스냅샷" value={snapshotCount} color="blue" icon="📝" />
              <StatCard label="프로젝트" value={stats.projectCount} color="purple" icon="📁" />
              <StatCard label="모듈" value={stats.moduleCount} color="emerald" icon="📦" />
              <StatCard label="기능" value={stats.featureCount} color="amber" icon="✨" />
            </div>

            {/* 평균 진행률 - 큰 게이지 */}
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald-800">평균 진행률</span>
                <span className="text-2xl font-bold text-emerald-600">
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
              {stats.avgProgress === null && (
                <p className="text-xs text-emerald-600/60">진행률 데이터가 없습니다</p>
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
                      <div key={domain}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{domain}</span>
                          <span className="text-xs text-gray-500">{count}건 ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">스냅샷 {snapshotCount}개</p>
            <p className="text-xs text-gray-400 mt-1">통계 데이터가 없습니다</p>
          </div>
        )}
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
    <div className={`p-4 rounded-2xl border ${colorClasses[color]} transition-all hover:scale-[1.02]`}>
      {icon && <span className="text-lg mb-1 block">{icon}</span>}
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-0.5">{label}</div>
    </div>
  );
}

