"use client";

/**
 * 주차 메타데이터 요약 패널
 * - 기본: 하단에 Mini Bar로 표시
 * - 확장 시: 중앙 하단에서 확장 (GitHub 스타일)
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-4 py-2.5 bg-white rounded-md border border-[#d0d7de] hover:border-[#0969da] transition-colors group"
        >
          {/* 스냅샷 수 */}
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#24292f]">{snapshotCount}</span>
            <span className="text-xs text-[#57606a]">스냅샷</span>
          </div>
          
          <div className="w-px h-4 bg-[#d0d7de]" />
          
          {/* 프로젝트/모듈/기능 수 */}
          {stats && (
            <div className="flex items-center gap-3 text-xs text-[#57606a]">
              <span>{stats.projectCount} 프로젝트</span>
              <span>{stats.moduleCount} 모듈</span>
              <span>{stats.featureCount} 기능</span>
            </div>
          )}
          
          {stats?.avgProgress !== null && stats?.avgProgress !== undefined && (
            <>
              <div className="w-px h-4 bg-[#d0d7de]" />
              
              {/* 진행률 */}
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-[#f6f8fa] rounded-full overflow-hidden border border-[#d0d7de]">
                  <div
                    className="h-full bg-[#1a7f37] rounded-full"
                    style={{ width: `${stats.avgProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#1a7f37]">{stats.avgProgress}%</span>
              </div>
            </>
          )}
          
          {/* 확장 아이콘 */}
          <div className="w-7 h-7 rounded bg-[#f6f8fa] flex items-center justify-center group-hover:bg-[#d0d7de] transition-colors">
            <svg className="w-3.5 h-3.5 text-[#57606a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* 확장된 패널 */}
      {shouldRender && (
        <>
          {/* 백드롭 */}
          <div 
            className="fixed inset-0 z-[60] bg-[#c8d1da66]"
            onClick={onToggle}
          />
          
          {/* 패널 */}
          <div 
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-xl transition-all duration-300 ease-out ${
              isAnimating 
                ? "opacity-100 scale-100 translate-y-0" 
                : "opacity-0 scale-95 translate-y-8"
            }`}
            style={{
              transformOrigin: "center bottom",
            }}
          >
            <div className="bg-white rounded-md border border-[#d0d7de] overflow-hidden">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] border-b border-[#d0d7de]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#ddf4ff] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0969da]" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1.5 3a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM1 7.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#24292f]">주차 요약</h3>
                    <p className="text-xs text-[#57606a]">스냅샷 {snapshotCount}개의 통계</p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded hover:bg-[#d0d7de] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#57606a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 콘텐츠 */}
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {stats ? (
                  <>
                    {/* 메인 통계 그리드 */}
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="스냅샷" value={snapshotCount} />
                      <StatCard label="프로젝트" value={stats.projectCount} />
                      <StatCard label="모듈" value={stats.moduleCount} />
                      <StatCard label="기능" value={stats.featureCount} />
                    </div>

                    {/* 평균 진행률 */}
                    <div className="p-4 bg-[#ddf4ff] rounded-md border border-[#54aeff]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#0969da]">평균 진행률</span>
                        <span className="text-xl font-semibold text-[#0969da]">
                          {stats.avgProgress !== null ? `${stats.avgProgress}%` : "-"}
                        </span>
                      </div>
                      {stats.avgProgress !== null && (
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#54aeff]">
                          <div
                            className="h-full bg-[#0969da] rounded-full transition-all duration-500"
                            style={{ width: `${stats.avgProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 도메인 분포 */}
                    {Object.keys(stats.domainDistribution).length > 0 && (
                      <div className="p-4 bg-white rounded-md border border-[#d0d7de]">
                        <h4 className="text-sm font-medium text-[#24292f] mb-3">
                          도메인 분포
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(stats.domainDistribution).map(([domain, count]) => {
                            const total = stats.totalEntries || Object.values(stats.domainDistribution).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={domain} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[#24292f] w-20 truncate">{domain}</span>
                                <div className="flex-1 h-2 bg-[#f6f8fa] rounded-full overflow-hidden border border-[#d0d7de]">
                                  <div
                                    className="h-full bg-[#0969da] rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[#57606a] w-14 text-right">{count}건 ({percentage}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded bg-[#f6f8fa] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#57606a]" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1.5 3a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM1 7.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#57606a]">스냅샷 {snapshotCount}개</p>
                    <p className="text-xs text-[#8c959f] mt-1">통계 데이터가 없습니다</p>
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
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="p-3 rounded-md border border-[#d0d7de] bg-[#f6f8fa] text-center hover:border-[#0969da] transition-colors">
      <div className="text-lg font-semibold text-[#24292f]">{value}</div>
      <div className="text-xs text-[#57606a] mt-0.5">{label}</div>
    </div>
  );
}
