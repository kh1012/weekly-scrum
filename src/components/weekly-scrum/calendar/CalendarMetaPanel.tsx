"use client";

/**
 * Calendar Meta Panel 컴포넌트 (Airbnb 스타일)
 *
 * 우측 사이드 패널: 요약 카드 + 랭킹 리스트 + 선택 상세
 */

import type {
  CalendarMode,
  WeekAggregation,
  ProjectFocusRangeSummary,
  MemberFocusRangeSummary,
} from "@/types/calendar";

interface CalendarMetaPanelProps {
  mode: CalendarMode;
  projectRangeSummary: ProjectFocusRangeSummary;
  memberRangeSummary: MemberFocusRangeSummary;
  selectedWeek: WeekAggregation | null;
  selectedInitiative: string | null;
  selectedMember: string | null;
}

export function CalendarMetaPanel({
  mode,
  projectRangeSummary,
  memberRangeSummary,
  selectedWeek,
  selectedInitiative,
  selectedMember,
}: CalendarMetaPanelProps) {
  if (mode === "project") {
    return (
      <ProjectFocusPanel
        summary={projectRangeSummary}
        selectedWeek={selectedWeek}
        selectedInitiative={selectedInitiative}
      />
    );
  }

  return (
    <MemberFocusPanel
      summary={memberRangeSummary}
      selectedWeek={selectedWeek}
      selectedMember={selectedMember}
    />
  );
}

// ========================================
// 프로젝트별 패널
// ========================================

interface ProjectFocusPanelProps {
  summary: ProjectFocusRangeSummary;
  selectedWeek: WeekAggregation | null;
  selectedInitiative: string | null;
}

function ProjectFocusPanel({
  summary,
  selectedWeek,
  selectedInitiative,
}: ProjectFocusPanelProps) {
  const avgRate =
    summary.totalPlannedTaskCount > 0
      ? Math.round(
          (summary.totalDoneTaskCount / summary.totalPlannedTaskCount) * 100
        )
      : 0;

  return (
    <div className="p-5 space-y-6">
      {/* 상단 요약 카드 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
            📊
          </span>
          기간 요약
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <SummaryItem
            label="참여 프로젝트"
            value={summary.totalInitiativeCount}
            unit="개"
            color="blue"
          />
          <SummaryItem
            label="참여 멤버"
            value={summary.totalMemberCount}
            unit="명"
            color="purple"
          />
          <SummaryItem
            label="진행 모듈"
            value={summary.totalModuleCount}
            unit="개"
            color="emerald"
          />
          <SummaryItem
            label="진행 피처"
            value={summary.totalFeatureCount}
            unit="개"
            color="orange"
          />
          <SummaryItem
            label="완료 Task"
            value={summary.totalDoneTaskCount}
            unit="건"
            color="pink"
          />
          <SummaryItem
            label="평균 달성률"
            value={avgRate}
            unit="%"
            color="cyan"
          />
        </div>
      </div>

      {/* 프로젝트 랭킹 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
            🏆
          </span>
          프로젝트 랭킹
        </h3>
        <div className="space-y-2">
          {summary.initiatives.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              데이터가 없습니다
            </p>
          ) : (
            summary.initiatives
              .slice(0, 8)
              .map((item, idx) => (
                <RankingItem
                  key={item.initiativeName}
                  rank={idx + 1}
                  name={item.initiativeName}
                  weekCount={item.weekCount}
                  doneCount={item.doneTaskCount}
                  plannedCount={item.plannedTaskCount}
                  isSelected={selectedInitiative === item.initiativeName}
                />
              ))
          )}
        </div>
      </div>

      {/* 선택된 프로젝트 상세 */}
      {selectedInitiative && selectedWeek && (
        <SelectedInitiativeDetail
          week={selectedWeek}
          initiativeName={selectedInitiative}
        />
      )}
    </div>
  );
}

// ========================================
// 멤버별 패널
// ========================================

interface MemberFocusPanelProps {
  summary: MemberFocusRangeSummary;
  selectedWeek: WeekAggregation | null;
  selectedMember: string | null;
}

function MemberFocusPanel({
  summary,
  selectedWeek,
  selectedMember,
}: MemberFocusPanelProps) {
  const avgInitiatives =
    summary.totalMemberCount > 0
      ? (summary.totalInitiativeCount / summary.totalMemberCount).toFixed(1)
      : "0";
  const avgRate =
    summary.totalPlannedTaskCount > 0
      ? Math.round(
          (summary.totalDoneTaskCount / summary.totalPlannedTaskCount) * 100
        )
      : 0;

  return (
    <div className="p-5 space-y-6">
      {/* 상단 요약 카드 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            📊
          </span>
          기간 요약
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <SummaryItem
            label="참여 멤버"
            value={summary.totalMemberCount}
            unit="명"
            color="violet"
          />
          <SummaryItem
            label="평균 프로젝트"
            value={avgInitiatives}
            unit="개/인"
            color="blue"
          />
          <SummaryItem
            label="참여 프로젝트"
            value={summary.totalInitiativeCount}
            unit="개"
            color="emerald"
          />
          <SummaryItem
            label="진행 모듈"
            value={summary.totalModuleCount}
            unit="개"
            color="orange"
          />
          <SummaryItem
            label="완료 Task"
            value={summary.totalDoneTaskCount}
            unit="건"
            color="pink"
          />
          <SummaryItem
            label="평균 달성률"
            value={avgRate}
            unit="%"
            color="cyan"
          />
        </div>
      </div>

      {/* 멤버 랭킹 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
            🏆
          </span>
          멤버 랭킹
        </h3>
        <div className="space-y-2">
          {summary.members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              데이터가 없습니다
            </p>
          ) : (
            summary.members
              .slice(0, 8)
              .map((item, idx) => (
                <RankingItem
                  key={item.memberName}
                  rank={idx + 1}
                  name={item.memberName}
                  weekCount={item.weekCount}
                  doneCount={item.doneTaskCount}
                  plannedCount={item.plannedTaskCount}
                  isSelected={selectedMember === item.memberName}
                />
              ))
          )}
        </div>
      </div>

      {/* 선택된 멤버 상세 */}
      {selectedMember && selectedWeek && (
        <SelectedMemberDetail week={selectedWeek} memberName={selectedMember} />
      )}
    </div>
  );
}

// ========================================
// 공통 서브 컴포넌트
// ========================================

type ColorType =
  | "blue"
  | "purple"
  | "emerald"
  | "orange"
  | "pink"
  | "cyan"
  | "violet";

function SummaryItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | string;
  unit: string;
  color: ColorType;
}) {
  const colorClasses: Record<ColorType, string> = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600",
    orange: "text-orange-600",
    pink: "text-pink-600",
    cyan: "text-cyan-600",
    violet: "text-violet-600",
  };

  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorClasses[color]}`}>
        {value}
        <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function RankingItem({
  rank,
  name,
  weekCount,
  doneCount,
  plannedCount,
  isSelected,
}: {
  rank: number;
  name: string;
  weekCount: number;
  doneCount: number;
  plannedCount: number;
  isSelected: boolean;
}) {
  const rate =
    plannedCount > 0 ? Math.round((doneCount / plannedCount) * 100) : 0;

  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-gray-900 bg-gray-50"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            rank <= 3
              ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-sm"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500">
            {weekCount}주 · {doneCount}/{plannedCount}건 ({rate}%)
          </p>
        </div>
      </div>
    </div>
  );
}

function SelectedInitiativeDetail({
  week,
  initiativeName,
}: {
  week: WeekAggregation;
  initiativeName: string;
}) {
  const initiative = week.initiatives.find(
    (i) => i.initiativeName === initiativeName
  );
  if (!initiative) return null;

  return (
    <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border border-blue-100">
      <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
        <span>📌</span>
        {initiativeName}
      </h3>
      <div className="space-y-4">
        <DetailRow
          label="참여 멤버"
          values={Array.from(initiative.members)}
          color="blue"
        />
        <DetailRow
          label="진행 모듈"
          values={Array.from(initiative.modules)}
          color="emerald"
        />
        <DetailRow
          label="진행 피처"
          values={Array.from(initiative.features)}
          color="purple"
        />
        <div className="pt-3 border-t border-blue-200/50">
          <p className="text-xs text-blue-700 font-medium">
            이 주에 {initiative.doneTaskCount}/{initiative.plannedTaskCount}{" "}
            Task 완료
            <span className="text-blue-500 ml-1">
              ({Math.round(initiative.avgCompletionRate * 100)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SelectedMemberDetail({
  week,
  memberName,
}: {
  week: WeekAggregation;
  memberName: string;
}) {
  const member = week.members.find((m) => m.memberName === memberName);
  if (!member) return null;

  return (
    <div className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/30 rounded-2xl border border-violet-100">
      <h3 className="text-sm font-bold text-violet-900 mb-4 flex items-center gap-2">
        <span>👤</span>
        {memberName}
      </h3>
      <div className="space-y-4">
        <DetailRow
          label="참여 프로젝트"
          values={Array.from(member.initiatives)}
          color="violet"
        />
        <DetailRow
          label="진행 모듈"
          values={Array.from(member.modules)}
          color="emerald"
        />
        <DetailRow
          label="진행 피처"
          values={Array.from(member.features)}
          color="orange"
        />
        <div className="pt-3 border-t border-violet-200/50">
          <p className="text-xs text-violet-700 font-medium">
            이 주에 {member.doneTaskCount}/{member.plannedTaskCount} Task 완료
            <span className="text-violet-500 ml-1">
              ({Math.round(member.avgCompletionRate * 100)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  values,
  color,
}: {
  label: string;
  values: string[];
  color: "blue" | "emerald" | "purple" | "violet" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
    violet: "bg-violet-100 text-violet-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.length === 0 ? (
          <span className="text-xs text-gray-400">없음</span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg ${colorClasses[color]}`}
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
