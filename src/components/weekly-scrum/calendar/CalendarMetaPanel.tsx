"use client";

/**
 * Calendar Meta Panel 컴포넌트
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
// 프로젝트 집중도 패널
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
      ? Math.round((summary.totalDoneTaskCount / summary.totalPlannedTaskCount) * 100)
      : 0;

  return (
    <div className="p-4 space-y-6">
      {/* 상단 요약 카드 */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          📊 기간 요약
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <SummaryItem label="참여 프로젝트" value={summary.totalInitiativeCount} unit="개" />
          <SummaryItem label="참여 멤버" value={summary.totalMemberCount} unit="명" />
          <SummaryItem label="진행 모듈" value={summary.totalModuleCount} unit="개" />
          <SummaryItem label="진행 피처" value={summary.totalFeatureCount} unit="개" />
          <SummaryItem label="완료 Task" value={summary.totalDoneTaskCount} unit="건" />
          <SummaryItem label="평균 달성률" value={avgRate} unit="%" />
        </div>
      </div>

      {/* 프로젝트 랭킹 */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          🏆 프로젝트 랭킹
        </h3>
        <div className="space-y-3">
          {summary.initiatives.length === 0 ? (
            <p className="text-sm text-gray-500">데이터가 없습니다</p>
          ) : (
            summary.initiatives.slice(0, 10).map((item, idx) => (
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
// 멤버 집중도 패널
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
      ? Math.round((summary.totalDoneTaskCount / summary.totalPlannedTaskCount) * 100)
      : 0;

  return (
    <div className="p-4 space-y-6">
      {/* 상단 요약 카드 */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          📊 기간 요약
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <SummaryItem label="참여 멤버" value={summary.totalMemberCount} unit="명" />
          <SummaryItem label="평균 프로젝트" value={avgInitiatives} unit="개/인" />
          <SummaryItem label="참여 프로젝트" value={summary.totalInitiativeCount} unit="개" />
          <SummaryItem label="진행 모듈" value={summary.totalModuleCount} unit="개" />
          <SummaryItem label="완료 Task" value={summary.totalDoneTaskCount} unit="건" />
          <SummaryItem label="평균 달성률" value={avgRate} unit="%" />
        </div>
      </div>

      {/* 멤버 랭킹 */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          🏆 멤버 랭킹
        </h3>
        <div className="space-y-3">
          {summary.members.length === 0 ? (
            <p className="text-sm text-gray-500">데이터가 없습니다</p>
          ) : (
            summary.members.slice(0, 10).map((item, idx) => (
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
        <SelectedMemberDetail
          week={selectedWeek}
          memberName={selectedMember}
        />
      )}
    </div>
  );
}

// ========================================
// 공통 서브 컴포넌트
// ========================================

function SummaryItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
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
  const rate = plannedCount > 0 ? Math.round((doneCount / plannedCount) * 100) : 0;

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-blue-200 bg-blue-50"
          : "border-gray-100 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            rank <= 3
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500">
            {weekCount}주 참여 · {doneCount}/{plannedCount} 완료 ({rate}%)
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
  const initiative = week.initiatives.find((i) => i.initiativeName === initiativeName);
  if (!initiative) return null;

  return (
    <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
      <h3 className="text-sm font-semibold text-blue-900 mb-4">
        📌 {initiativeName} 상세
      </h3>
      <div className="space-y-3">
        <DetailRow label="참여 멤버" values={Array.from(initiative.members)} />
        <DetailRow label="진행 모듈" values={Array.from(initiative.modules)} />
        <DetailRow label="진행 피처" values={Array.from(initiative.features)} />
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            이 주에 {initiative.doneTaskCount}/{initiative.plannedTaskCount} Task 완료 (
            {Math.round(initiative.avgCompletionRate * 100)}%)
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
    <div className="p-4 bg-white rounded-xl border border-violet-100 shadow-sm">
      <h3 className="text-sm font-semibold text-violet-900 mb-4">
        👤 {memberName} 상세
      </h3>
      <div className="space-y-3">
        <DetailRow label="참여 프로젝트" values={Array.from(member.initiatives)} />
        <DetailRow label="진행 모듈" values={Array.from(member.modules)} />
        <DetailRow label="진행 피처" values={Array.from(member.features)} />
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            이 주에 {member.doneTaskCount}/{member.plannedTaskCount} Task 완료 (
            {Math.round(member.avgCompletionRate * 100)}%)
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-xs text-gray-400">없음</span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

