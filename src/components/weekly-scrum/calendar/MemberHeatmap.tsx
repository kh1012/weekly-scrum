"use client";

/**
 * Member Heatmap 컴포넌트 (Airbnb 스타일)
 *
 * 멤버별 주간 기여도를 히트맵 형태로 시각화
 */

import { useMemo } from "react";
import type { WeekAggregation, MemberFocusRangeSummary } from "@/types/calendar";
import { formatWeekLabel } from "@/lib/calendarAggregation";

interface MemberHeatmapProps {
  weeks: WeekAggregation[];
  memberRangeSummary: MemberFocusRangeSummary;
  selectedMonth: string;
}

// 히트맵 색상 (강도에 따라)
const HEATMAP_COLORS = [
  "bg-gray-100", // 0
  "bg-emerald-100", // 1
  "bg-emerald-200", // 2
  "bg-emerald-300", // 3
  "bg-emerald-400", // 4
  "bg-emerald-500", // 5+
];

function getHeatmapColor(value: number, max: number): string {
  if (value === 0) return HEATMAP_COLORS[0];
  const ratio = value / Math.max(max, 1);
  if (ratio <= 0.2) return HEATMAP_COLORS[1];
  if (ratio <= 0.4) return HEATMAP_COLORS[2];
  if (ratio <= 0.6) return HEATMAP_COLORS[3];
  if (ratio <= 0.8) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

export function MemberHeatmap({
  weeks,
  memberRangeSummary,
  selectedMonth,
}: MemberHeatmapProps) {
  // 멤버 목록 (focusScore 순)
  const members = useMemo(() => {
    return memberRangeSummary.members.map((m) => m.memberName);
  }, [memberRangeSummary]);

  // 주별 멤버 데이터 매트릭스 생성
  const heatmapData = useMemo(() => {
    const matrix: Map<string, Map<string, number>> = new Map();
    let maxValue = 0;

    weeks.forEach((week) => {
      const weekKey = `${week.key.year}-W${week.key.weekIndex}`;
      week.members.forEach((member) => {
        if (!matrix.has(member.memberName)) {
          matrix.set(member.memberName, new Map());
        }
        const value = member.doneTaskCount;
        matrix.get(member.memberName)!.set(weekKey, value);
        if (value > maxValue) maxValue = value;
      });
    });

    return { matrix, maxValue };
  }, [weeks]);

  if (weeks.length === 0 || members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 font-medium">이 달에 데이터가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">다른 월을 선택해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">멤버별 기여 히트맵</h2>
          <p className="text-sm text-gray-500 mt-1">
            {members.length}명의 멤버 · {weeks.length}주간 데이터
          </p>
        </div>
        
        {/* 범례 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">적음</span>
          <div className="flex gap-0.5">
            {HEATMAP_COLORS.map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500">많음</span>
        </div>
      </div>

      {/* 히트맵 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="sticky left-0 z-10 bg-gray-50/80 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                  멤버
                </th>
                {weeks.map((week) => (
                  <th
                    key={`${week.key.year}-${week.key.weekIndex}`}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-600 border-b border-gray-100 min-w-[80px]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-gray-900">W{week.key.weekIndex}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {week.weekStart.split("-").slice(1).join("/")}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 border-b border-gray-100 bg-gray-50/80">
                  합계
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((memberName, idx) => {
                const memberData = heatmapData.matrix.get(memberName);
                const memberSummary = memberRangeSummary.members.find(
                  (m) => m.memberName === memberName
                );
                const totalDone = memberSummary?.doneTaskCount || 0;

                return (
                  <tr
                    key={memberName}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                          {memberName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{memberName}</p>
                          <p className="text-xs text-gray-400">
                            {memberSummary?.initiatives.size || 0}개 프로젝트
                          </p>
                        </div>
                      </div>
                    </td>
                    {weeks.map((week) => {
                      const weekKey = `${week.key.year}-W${week.key.weekIndex}`;
                      const value = memberData?.get(weekKey) || 0;
                      const color = getHeatmapColor(value, heatmapData.maxValue);

                      return (
                        <td
                          key={weekKey}
                          className="px-3 py-3 text-center"
                        >
                          <div
                            className={`w-10 h-10 mx-auto rounded-lg ${color} flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-default ${
                              value > 0 ? "text-emerald-900" : "text-gray-400"
                            }`}
                            title={`${memberName}: ${value}건 완료`}
                          >
                            {value > 0 ? value : "-"}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center bg-gray-50/50">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-900 text-white">
                        {totalDone}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="총 멤버"
          value={members.length}
          unit="명"
          icon="👥"
          color="blue"
        />
        <StatCard
          label="총 완료 Task"
          value={memberRangeSummary.totalDoneTaskCount}
          unit="건"
          icon="✅"
          color="emerald"
        />
        <StatCard
          label="평균 달성률"
          value={
            memberRangeSummary.totalPlannedTaskCount > 0
              ? Math.round(
                  (memberRangeSummary.totalDoneTaskCount /
                    memberRangeSummary.totalPlannedTaskCount) *
                    100
                )
              : 0
          }
          unit="%"
          icon="📈"
          color="purple"
        />
        <StatCard
          label="활동 주차"
          value={weeks.length}
          unit="주"
          icon="📅"
          color="orange"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100/50 border-blue-100",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-100",
    purple: "from-purple-50 to-purple-100/50 border-purple-100",
    orange: "from-orange-50 to-orange-100/50 border-orange-100",
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

