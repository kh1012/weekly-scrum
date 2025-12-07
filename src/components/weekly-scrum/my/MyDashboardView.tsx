"use client";

import { getProgressColor } from "@/lib/colorDefines";
import { useMyDashboard } from "./hooks/useMyDashboard";
import {
  StatCard,
  ItemRow,
  DomainPieChartCard,
  DashboardFilters,
  TrendChart,
  ProjectBarChart,
  RiskSummary,
  ProgressOverview,
  MyCollaborationStatus,
  ModuleDistribution,
  CollaborationIntensity,
} from "./components";
import { MyCollaborationRadar } from "@/components/visualizations/MyCollaborationRadar";
import { MyBottleneckTimeline } from "@/components/visualizations/MyBottleneckTimeline";
import { MyCollaborationOrbit } from "@/components/visualizations/MyCollaborationOrbit";

export function MyDashboardView() {
  const {
    currentData,
    members,
    activeMember,
    memberItems,
    weeklyMemberItems,
    stats,
    weeklyTrend,
    selectMode,
    collaborationStatus,
    collaborationIntensity,
    bottleneckTimelineData,
    selectedDomains,
    selectedProjects,
    availableDomains,
    availableProjects,
    trendPeriod,
    setTrendPeriod,
    handleMemberChange,
    toggleDomain,
    toggleProject,
    toggleAllDomains,
    toggleAllProjects,
    resetFilters,
  } = useMyDashboard();

  if (!currentData) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--notion-text-secondary)" }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 멤버 선택 */}
      <DashboardHeader
        members={members}
        activeMember={activeMember}
        onMemberChange={handleMemberChange}
      />

      {/* 필터 영역 */}
      <DashboardFilters
        availableDomains={availableDomains}
        availableProjects={availableProjects}
        selectedDomains={selectedDomains}
        selectedProjects={selectedProjects}
        onToggleDomain={toggleDomain}
        onToggleProject={toggleProject}
        onToggleAllDomains={toggleAllDomains}
        onToggleAllProjects={toggleAllProjects}
        onResetFilters={resetFilters}
      />

      {stats && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard value={stats.total} label="전체 항목" />
            <StatCard value={stats.completed} label="완료" color="var(--notion-green)" />
            <StatCard
              value={`${stats.avgProgress}%`}
              label="평균 진척률"
              color={getProgressColor(stats.avgProgress)}
            />
            <StatCard
              value={`${stats.avgAchievement}%`}
              label="달성률"
              color={stats.avgAchievement >= 80 ? "var(--notion-green)" : "var(--notion-red)"}
            />
            <StatCard value={stats.atRisk} label="주의 필요" color="var(--notion-orange)" highlight={stats.atRisk > 0} />
          </div>

          {/* 주차별 트렌드 차트 */}
          <TrendChart
            data={weeklyTrend as Parameters<typeof TrendChart>[0]["data"]}
            period={trendPeriod}
            onPeriodChange={setTrendPeriod}
            isRangeMode={selectMode === "range"}
          />

          {/* 도메인 & 프로젝트 차트 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DomainPieChartCard data={stats.domainPieData} domainStats={stats.domains} />
            <ProjectBarChart data={stats.projectBarData} />
          </div>

          {/* 진행률 바 */}
          <ProgressOverview
            avgPlan={stats.avgPlan}
            avgProgress={stats.avgProgress}
            avgAchievement={stats.avgAchievement}
          />

          {/* 리스크 현황 */}
          <RiskSummary riskCounts={stats.riskCounts} />

          {/* 협업 & 모듈 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MyCollaborationStatus
              waitingForMe={collaborationStatus.waitingForMe}
              iAmWaitingFor={collaborationStatus.iAmWaitingFor}
              myCollaborators={collaborationStatus.myCollaborators}
            />
            <MyCollaborationRadar items={currentData.items} memberName={activeMember} />
          </div>

          {/* 협업 궤도 */}
          <MyCollaborationOrbit items={currentData.items} memberName={activeMember} />

          {/* 모듈 분포 */}
          <ModuleDistribution items={memberItems} />

          {/* 협업 강도 & 병목 타임라인 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollaborationIntensity weeklyData={collaborationIntensity} />
            <MyBottleneckTimeline weeklyData={bottleneckTimelineData} memberName={activeMember} />
          </div>

          {/* 항목 리스트 */}
          {selectMode === "range" && weeklyMemberItems.length > 0 ? (
            // 범위 모드: 주차별로 그룹화
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
                📝 주차별 업무 상세 목록 ({memberItems.length}개)
              </h3>
              {weeklyMemberItems.map((weekData) => (
                <div key={weekData.weekKey} className="notion-card overflow-hidden">
                  <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      borderBottom: "1px solid var(--notion-border)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: "var(--notion-blue-bg)",
                          color: "var(--notion-blue)",
                        }}
                      >
                        {weekData.weekLabel}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--notion-text-secondary)" }}
                      >
                        {weekData.items.length}개 항목
                      </span>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "var(--notion-text-tertiary)" }}
                    >
                      📅 {weekData.range}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--notion-border)" }}>
                    {weekData.items.map((item, idx) => (
                      <ItemRow key={idx} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 단일 주차 모드: 기존 표시
            <div className="notion-card overflow-hidden">
              <div
                className="px-4 py-3"
                style={{
                  background: "var(--notion-bg-secondary)",
                  borderBottom: "1px solid var(--notion-border)",
                }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
                  📝 업무 상세 목록 ({memberItems.length}개)
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--notion-border)" }}>
                {memberItems.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 대시보드 헤더
interface DashboardHeaderProps {
  members: string[];
  activeMember: string;
  onMemberChange: (member: string) => void;
}

function DashboardHeader({ members, activeMember, onMemberChange }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--notion-text)" }}>
          개인 대시보드
        </h1>
        <p className="text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          개인 업무 현황을 한눈에 확인하세요
        </p>
      </div>
      <select
        value={activeMember}
        onChange={(e) => onMemberChange(e.target.value)}
        className="notion-select text-base font-medium px-4 py-2"
      >
        {members.map((member) => (
          <option key={member} value={member}>
            {member}
          </option>
        ))}
      </select>
    </div>
  );
}
