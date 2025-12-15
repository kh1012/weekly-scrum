"use client";

/**
 * 주차 메타데이터 요약 패널
 * - 기본: 접힌 상태
 * - 더보기 클릭 시 확장
 */

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
  return (
    <div
      className={`shrink-0 border-l border-gray-100 bg-gradient-to-b from-gray-50 to-white transition-all duration-300 ${
        isExpanded ? "w-72" : "w-14"
      }`}
    >
      {isExpanded ? (
        <ExpandedPanel
          stats={stats}
          snapshotCount={snapshotCount}
          onCollapse={onToggle}
        />
      ) : (
        <CollapsedPanel
          stats={stats}
          snapshotCount={snapshotCount}
          onExpand={onToggle}
        />
      )}
    </div>
  );
}

// 접힌 상태
function CollapsedPanel({
  stats,
  snapshotCount,
  onExpand,
}: {
  stats: WeekStatsData | null;
  snapshotCount: number;
  onExpand: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center py-4">
      <button
        onClick={onExpand}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="메타데이터 보기"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="mt-4 space-y-3 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">{snapshotCount}</div>
          <div className="text-[10px] text-gray-400">스냅샷</div>
        </div>
        {stats && (
          <>
            <div className="w-6 h-px bg-gray-200 mx-auto" />
            <div>
              <div className="text-sm font-semibold text-gray-700">{stats.projectCount}</div>
              <div className="text-[10px] text-gray-400">프로젝트</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">{stats.totalEntries}</div>
              <div className="text-[10px] text-gray-400">엔트리</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 확장된 상태
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
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">주차 요약</h3>
        <button
          onClick={onCollapse}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="접기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 스냅샷 수 */}
        <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{snapshotCount}</div>
          <div className="text-sm text-gray-500 mt-1">스냅샷</div>
        </div>

        {stats ? (
          <>
            {/* 통계 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="프로젝트" value={stats.projectCount} color="blue" />
              <StatCard label="모듈" value={stats.moduleCount} color="purple" />
              <StatCard label="기능" value={stats.featureCount} color="emerald" />
              <StatCard label="엔트리" value={stats.totalEntries} color="amber" />
            </div>

            {/* 평균 진행률 */}
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">평균 진행률</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.avgProgress !== null ? `${stats.avgProgress}%` : "-"}
                </span>
              </div>
              {stats.avgProgress !== null && (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${stats.avgProgress}%` }}
                  />
                </div>
              )}
              {stats.avgProgress === null && (
                <p className="text-xs text-gray-400">진행률 데이터가 없습니다</p>
              )}
            </div>

            {/* 도메인 분포 */}
            {Object.keys(stats.domainDistribution).length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">도메인 분포</h4>
                <div className="space-y-2">
                  {Object.entries(stats.domainDistribution).map(([domain, count]) => (
                    <div key={domain} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{domain}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">통계 데이터가 없습니다</p>
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
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "emerald" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

