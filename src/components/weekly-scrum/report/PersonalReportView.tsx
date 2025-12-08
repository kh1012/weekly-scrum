"use client";

import { usePersonalReport } from "./hooks/usePersonalReport";
import type {
  DomainSummary,
  ProjectSummary,
  ModuleSummary,
  CollaboratorSummary,
} from "./hooks/usePersonalReport";
import type { ScrumItem } from "@/types/scrum";
import { getProgressColor } from "@/lib/colorDefines";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";

export function PersonalReportView() {
  const { currentData, members, activeMember, reportData, handleMemberChange } =
    usePersonalReport();

  if (!currentData) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ color: "var(--notion-text-secondary)" }}
      >
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <ReportHeader
        members={members}
        activeMember={activeMember}
        onMemberChange={handleMemberChange}
      />

      {reportData && (
        <>
          {/* 전체 요약 카드 */}
          <SummaryCards data={reportData} />

          {/* 담당 범위 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 도메인 범위 */}
            <DomainScope domains={reportData.domains} />

            {/* 협업자 목록 */}
            <CollaboratorScope collaborators={reportData.collaborators} />
          </div>

          {/* 프로젝트 범위 */}
          <ProjectScope projects={reportData.projects} />

          {/* 모듈 범위 */}
          <ModuleScope modules={reportData.modules} />

          {/* 스냅샷 리스트 */}
          <SnapshotList snapshots={reportData.snapshots} />
        </>
      )}
    </div>
  );
}

// 헤더 컴포넌트
interface ReportHeaderProps {
  members: string[];
  activeMember: string;
  onMemberChange: (member: string) => void;
}

function ReportHeader({
  members,
  activeMember,
  onMemberChange,
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1
          className="text-lg sm:text-xl font-bold"
          style={{ color: "var(--notion-text)" }}
        >
          개인 리포트
        </h1>
        <p
          className="text-xs sm:text-sm"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          팀원의 담당 업무 범위와 스냅샷 정보를 한눈에 확인하세요
        </p>
      </div>
      <select
        value={activeMember}
        onChange={(e) => onMemberChange(e.target.value)}
        className="notion-select text-sm sm:text-base font-medium px-3 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto"
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

// 요약 카드
interface SummaryCardsProps {
  data: {
    totalSnapshots: number;
    avgProgress: number;
    completedCount: number;
    inProgressCount: number;
    atRiskCount: number;
    domains: DomainSummary[];
    projects: ProjectSummary[];
    modules: ModuleSummary[];
  };
}

function SummaryCards({ data }: SummaryCardsProps) {
  const progressColor = getProgressColor(data.avgProgress);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <StatCard value={data.totalSnapshots} label="전체 스냅샷" />
      <StatCard
        value={`${data.avgProgress}%`}
        label="평균 진척률"
        color={progressColor}
      />
      <StatCard
        value={data.completedCount}
        label="완료"
        color="var(--notion-green)"
      />
      <StatCard value={data.inProgressCount} label="진행 중" />
      <StatCard
        value={data.atRiskCount}
        label="리스크"
        color={data.atRiskCount > 0 ? "var(--notion-red)" : undefined}
        highlight={data.atRiskCount > 0}
      />
      <StatCard value={data.domains.length} label="도메인" />
      <StatCard value={data.projects.length} label="프로젝트" />
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  value: number | string;
  label: string;
  color?: string;
  highlight?: boolean;
}

function StatCard({ value, label, color, highlight }: StatCardProps) {
  return (
    <div
      className="notion-card p-3"
      style={{
        borderLeft: highlight
          ? "3px solid var(--notion-red)"
          : "1px solid var(--notion-border)",
      }}
    >
      <div
        className="text-xl font-bold"
        style={{ color: color || "var(--notion-text)" }}
      >
        {value}
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: "var(--notion-text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

// 도메인 범위
interface DomainScopeProps {
  domains: DomainSummary[];
}

function DomainScope({ domains }: DomainScopeProps) {
  return (
    <div className="notion-card overflow-hidden">
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--notion-border)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <h3
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: "var(--notion-text)" }}
        >
          <span>🏷️</span>
          <span>담당 도메인 ({domains.length})</span>
        </h3>
      </div>
      <div className="p-4">
        {domains.length === 0 ? (
          <div
            className="text-sm text-center py-4"
            style={{ color: "var(--notion-text-muted)" }}
          >
            데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div
                key={domain.name}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--notion-bg-hover)" }}
              >
                <div className="flex items-center gap-3">
                  <DomainBadge domain={domain.name} />
                  <div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      {domain.projects.length}개 프로젝트
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-medium"
                    style={{ color: getProgressColor(domain.avgProgress) }}
                  >
                    {domain.avgProgress}%
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    {domain.count}개 스냅샷
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 협업자 범위
interface CollaboratorScopeProps {
  collaborators: CollaboratorSummary[];
}

function CollaboratorScope({ collaborators }: CollaboratorScopeProps) {
  return (
    <div className="notion-card overflow-hidden">
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--notion-border)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <h3
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: "var(--notion-text)" }}
        >
          <span>🤝</span>
          <span>협업자 ({collaborators.length})</span>
        </h3>
      </div>
      <div className="p-4">
        {collaborators.length === 0 ? (
          <div
            className="text-sm text-center py-4"
            style={{ color: "var(--notion-text-muted)" }}
          >
            협업 데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div
                key={collab.name}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: "var(--notion-bg-hover)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      background: "var(--notion-accent-light)",
                      color: "var(--notion-accent)",
                    }}
                  >
                    {collab.name.charAt(0)}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--notion-text)" }}
                  >
                    {collab.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {collab.relations.pair > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                      }}
                    >
                      pair {collab.relations.pair}
                    </span>
                  )}
                  {collab.relations.pre > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "#f59e0b",
                      }}
                    >
                      pre {collab.relations.pre}
                    </span>
                  )}
                  {collab.relations.post > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                      }}
                    >
                      post {collab.relations.post}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 프로젝트 범위
interface ProjectScopeProps {
  projects: ProjectSummary[];
}

function ProjectScope({ projects }: ProjectScopeProps) {
  return (
    <div className="notion-card overflow-hidden">
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--notion-border)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <h3
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: "var(--notion-text)" }}
        >
          <span>📁</span>
          <span>담당 프로젝트 ({projects.length})</span>
        </h3>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--notion-border)" }}>
        {projects.length === 0 ? (
          <div
            className="text-sm text-center py-6"
            style={{ color: "var(--notion-text-muted)" }}
          >
            데이터가 없습니다
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.name} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: "var(--notion-text)" }}
                  >
                    {project.name}
                  </span>
                  <DomainBadge domain={project.domain} />
                </div>
                <div className="text-right">
                  <span
                    className="text-sm font-bold"
                    style={{ color: getProgressColor(project.avgProgress) }}
                  >
                    {project.avgProgress}%
                  </span>
                  <span
                    className="text-xs ml-2"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    ({project.count} 스냅샷)
                  </span>
                </div>
              </div>
              {/* 모듈 목록 */}
              {project.modules.length > 0 && (
                <div className="mb-2">
                  <span
                    className="text-xs"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    모듈:{" "}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.modules.map((module) => (
                      <span
                        key={module}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "var(--notion-bg-secondary)",
                          color: "var(--notion-text-secondary)",
                        }}
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* 피쳐 목록 */}
              <div>
                <span
                  className="text-xs"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  피쳐:{" "}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.features.slice(0, 5).map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "var(--notion-accent-light)",
                        color: "var(--notion-accent)",
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                  {project.features.length > 5 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "var(--notion-bg-secondary)",
                        color: "var(--notion-text-muted)",
                      }}
                    >
                      +{project.features.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 모듈 범위
interface ModuleScopeProps {
  modules: ModuleSummary[];
}

function ModuleScope({ modules }: ModuleScopeProps) {
  // 프로젝트별로 그룹화
  const groupedByProject = modules.reduce<Record<string, ModuleSummary[]>>(
    (acc, module) => {
      if (!acc[module.project]) {
        acc[module.project] = [];
      }
      acc[module.project].push(module);
      return acc;
    },
    {}
  );

  return (
    <div className="notion-card overflow-hidden">
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--notion-border)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <h3
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: "var(--notion-text)" }}
        >
          <span>📦</span>
          <span>담당 모듈 ({modules.length})</span>
        </h3>
      </div>
      <div className="p-4">
        {modules.length === 0 ? (
          <div
            className="text-sm text-center py-4"
            style={{ color: "var(--notion-text-muted)" }}
          >
            데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByProject).map(([projectName, projectModules]) => (
              <div key={projectName}>
                <div
                  className="text-xs font-medium mb-2"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  {projectName}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {projectModules.map((module) => (
                    <div
                      key={`${module.project}/${module.name}`}
                      className="p-3 rounded-lg"
                      style={{ background: "var(--notion-bg-hover)" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--notion-text)" }}
                        >
                          {module.name}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: getProgressColor(module.avgProgress) }}
                        >
                          {module.avgProgress}%
                        </span>
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--notion-text-muted)" }}
                      >
                        {module.count}개 스냅샷 · {module.features.length}개 피쳐
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 스냅샷 리스트
interface SnapshotListProps {
  snapshots: ScrumItem[];
}

function SnapshotList({ snapshots }: SnapshotListProps) {
  return (
    <div className="notion-card overflow-hidden">
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: "var(--notion-border)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <h3
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: "var(--notion-text)" }}
        >
          <span>📝</span>
          <span>스냅샷 목록 ({snapshots.length})</span>
        </h3>
      </div>
      <div className="p-4">
        {snapshots.length === 0 ? (
          <div
            className="text-sm text-center py-4"
            style={{ color: "var(--notion-text-muted)" }}
          >
            스냅샷이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshots.map((item, index) => (
              <SnapshotCard key={`${item.topic}-${index}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 스냅샷 카드
interface SnapshotCardProps {
  item: ScrumItem;
}

function SnapshotCard({ item }: SnapshotCardProps) {
  const progressColor = getProgressColor(item.progressPercent);

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: "var(--notion-bg)",
        border: "1px solid var(--notion-border)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div
            className="font-medium truncate"
            style={{ color: "var(--notion-text)" }}
          >
            {item.topic}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DomainBadge domain={item.domain} />
            <span
              className="text-xs truncate"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {item.project}
              {item.module && ` / ${item.module}`}
            </span>
          </div>
        </div>
        {item.riskLevel !== null && item.riskLevel > 0 && (
          <RiskLevelBadge level={item.riskLevel} />
        )}
      </div>

      {/* 진행률 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "var(--notion-text-muted)" }}>진척률</span>
          <span style={{ color: progressColor }} className="font-bold">
            {item.progressPercent}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--notion-bg-secondary)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${item.progressPercent}%`,
              background: progressColor,
            }}
          />
        </div>
      </div>

      {/* 진행 내용 */}
      {item.progress.length > 0 && (
        <div className="space-y-1">
          {item.progress.slice(0, 2).map((p, i) => (
            <div
              key={i}
              className="text-xs flex items-start gap-1"
              style={{ color: "var(--notion-text-secondary)" }}
            >
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span className="line-clamp-1">{p}</span>
            </div>
          ))}
          {item.progress.length > 2 && (
            <div
              className="text-xs"
              style={{ color: "var(--notion-text-muted)" }}
            >
              +{item.progress.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* 협업자 */}
      {item.collaborators && item.collaborators.length > 0 && (
        <div
          className="flex flex-wrap gap-1 mt-3 pt-2 border-t"
          style={{ borderColor: "var(--notion-border)" }}
        >
          {item.collaborators.map((collab, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background:
                  collab.relation === "pair"
                    ? "rgba(59, 130, 246, 0.15)"
                    : collab.relation === "pre"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(34, 197, 94, 0.15)",
                color:
                  collab.relation === "pair"
                    ? "#3b82f6"
                    : collab.relation === "pre"
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              {collab.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

