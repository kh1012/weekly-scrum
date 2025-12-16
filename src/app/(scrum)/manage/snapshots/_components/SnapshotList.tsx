"use client";

/**
 * 스냅샷 목록 컴포넌트
 * - Pinterest 스타일 그리드 / 리스트 뷰 토글
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import type { SnapshotSummary } from "./SnapshotsMainView";

// Entry 타입 (개별 카드용)
interface SnapshotEntry {
  snapshotId: string;
  entryIndex: number;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  past_week?: { tasks?: { title: string; progress: number }[] };
  this_week?: { tasks?: string[] };
  risks?: string[];
  risk_level?: number;
  collaborators?: { name: string; relations?: string[] }[];
}

interface SnapshotListProps {
  snapshots: SnapshotSummary[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  onRefresh: () => void;
  year: number;
  week: number;
  allExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function SnapshotList({
  snapshots,
  isLoading,
  viewMode,
  year,
  week,
  allExpanded = false,
}: SnapshotListProps) {
  const router = useRouter();

  // 개별 카드 편집 핸들러
  const handleEditCard = (snapshotId: string, entryIndex?: number) => {
    navigationProgress.start();
    const url = `/manage/snapshots/${year}/${week}/edit?snapshotId=${snapshotId}${
      entryIndex !== undefined ? `&entryIndex=${entryIndex}` : ""
    }`;
    router.push(url);
  };

  // 스냅샷의 entries를 펼쳐서 개별 카드로 표시
  const allEntries: SnapshotEntry[] = snapshots.flatMap((snapshot) =>
    snapshot.entries.map((entry, index) => ({
      snapshotId: snapshot.id,
      entryIndex: index,
      domain: entry.domain,
      project: entry.project,
      module: entry.module,
      feature: entry.feature,
      past_week: entry.past_week,
      this_week: entry.this_week,
      risks: entry.risks,
      risk_level: entry.risk_level,
      collaborators: entry.collaborators?.map((c) => ({
        name: c.name,
        relations: c.relations,
      })),
    }))
  );

  // 로딩 중이고 데이터가 없으면 로딩 상태 표시
  if (isLoading && snapshots.length === 0) {
    return <LogoLoadingSpinner />;
  }

  // 로딩이 끝나고 데이터가 없으면 빈 상태 표시
  if (!isLoading && snapshots.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* 스냅샷 목록 */}
      {viewMode === "grid" ? (
        <GridView
          entries={allEntries}
          allExpanded={allExpanded}
          onEditCard={handleEditCard}
        />
      ) : (
        <ListView entries={allEntries} onEditCard={handleEditCard} />
      )}
    </div>
  );
}

// 그리드 뷰 (Pinterest 스타일)
function GridView({
  entries,
  allExpanded,
  onEditCard,
}: {
  entries: SnapshotEntry[];
  allExpanded: boolean;
  onEditCard: (snapshotId: string, entryIndex?: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entries.map((entry) => (
        <EntryCard
          key={`${entry.snapshotId}-${entry.entryIndex}`}
          entry={entry}
          forceExpanded={allExpanded}
          onEdit={() => onEditCard(entry.snapshotId, entry.entryIndex)}
        />
      ))}
    </div>
  );
}

// 리스트 뷰
function ListView({
  entries,
  onEditCard,
}: {
  entries: SnapshotEntry[];
  onEditCard: (snapshotId: string, entryIndex?: number) => void;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryRow
          key={`${entry.snapshotId}-${entry.entryIndex}`}
          entry={entry}
          onEdit={() => onEditCard(entry.snapshotId, entry.entryIndex)}
        />
      ))}
    </div>
  );
}

// Entry 카드 (그리드용) - 개별 엔트리 표시
function EntryCard({
  entry,
  forceExpanded = false,
  onEdit,
}: {
  entry: SnapshotEntry;
  forceExpanded?: boolean;
  onEdit?: () => void;
}) {
  const [localExpanded, setLocalExpanded] = useState(false);

  // forceExpanded가 false로 변경되면 localExpanded도 리셋
  useEffect(() => {
    if (!forceExpanded) {
      setLocalExpanded(false);
    }
  }, [forceExpanded]);

  const isExpanded = forceExpanded || localExpanded;

  // 데이터 추출
  const pastWeekTasks = entry.past_week?.tasks || [];
  const thisWeekTasks = entry.this_week?.tasks || [];
  const risks = entry.risks || [];
  const riskLevel = entry.risk_level || 0;
  const collaborators = entry.collaborators || [];

  // 진행률 계산
  const avgProgress =
    pastWeekTasks.length > 0
      ? Math.round(
          pastWeekTasks.reduce((sum, t) => sum + t.progress, 0) /
            pastWeekTasks.length
        )
      : null;

  // 관계 색상 매핑
  const getRelationStyle = (relations?: string[]) => {
    const rel = relations?.[0];
    if (rel === "pair")
      return { bg: "bg-purple-100", text: "text-purple-700", label: "페어" };
    if (rel === "pre")
      return { bg: "bg-blue-100", text: "text-blue-700", label: "선행" };
    if (rel === "post")
      return { bg: "bg-emerald-100", text: "text-emerald-700", label: "후행" };
    return { bg: "bg-gray-100", text: "text-gray-600", label: "" };
  };

  // 리스크 레벨 색상
  const getRiskLevelStyle = (level: number) => {
    if (level >= 3)
      return { bg: "bg-red-100", text: "text-red-600", label: "높음" };
    if (level >= 2)
      return { bg: "bg-orange-100", text: "text-orange-600", label: "중간" };
    if (level >= 1)
      return { bg: "bg-yellow-100", text: "text-yellow-600", label: "낮음" };
    return { bg: "bg-gray-100", text: "text-gray-500", label: "없음" };
  };

  const riskStyle = getRiskLevelStyle(riskLevel);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-fit"
      onClick={() => setLocalExpanded(!localExpanded)}
    >
      {/* 헤더 - 메타 태그 세로 정렬 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* 세로 방향 메타 정보 */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Domain */}
            {entry.domain && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Domain
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.domain}
                </span>
              </div>
            )}
            {/* Project */}
            {entry.project && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Project
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.project}
                </span>
              </div>
            )}
            {/* Module */}
            {entry.module && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Module
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.module}
                </span>
              </div>
            )}
            {/* Feature */}
            {entry.feature && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Feature
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                  {entry.feature}
                </span>
              </div>
            )}
            {/* 진행률 (접힌 상태에서만 표시 - 확장 시 상세 내용에서 표시됨) */}
            {!isExpanded && avgProgress !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  진행률
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">
                    {avgProgress}%
                  </span>
                </div>
              </div>
            )}
            {/* 리스크 레벨 (접힌 상태에서도 표시) */}
            {riskLevel > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">
                  Risk
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${riskStyle.bg} ${riskStyle.text}`}
                >
                  Lv.{riskLevel} {riskStyle.label}
                </span>
              </div>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 편집 버튼 */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg transition-all duration-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                title="편집하기"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}

            {/* 펼치기/접기 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalExpanded(!localExpanded);
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isExpanded
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 펼친 내용 - ScrumCard 스타일 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 진행률 요약 */}
          {avgProgress !== null && (
            <div className="mx-4 my-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">평균 진행률</span>
                <span
                  className={`font-semibold ${
                    avgProgress === 100 ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  {avgProgress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    avgProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* PAST WEEK TASKS */}
          {pastWeekTasks.length > 0 && (
            <div className="mx-4 mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                PAST WEEK TASKS:
              </div>
              <ul className="space-y-1">
                {pastWeekTasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-700"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="flex-1">{task.title}</span>
                    <span
                      className={`shrink-0 text-[10px] font-medium ${
                        task.progress === 100
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      {task.progress}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk 표시 */}
          {(risks.length > 0 || riskLevel > 0) && (
            <div className="mx-4 mb-3 flex items-start gap-2 text-xs">
              <span
                className={`font-medium ${
                  riskLevel >= 3
                    ? "text-red-600"
                    : riskLevel >= 2
                    ? "text-orange-600"
                    : riskLevel >= 1
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                Risk:
              </span>
              <span className="text-gray-700">
                {risks.length > 0 ? risks.join(", ") : "미정"}
              </span>
            </div>
          )}

          {/* Collaborators 표시 (태그 형태) */}
          {collaborators.length > 0 && (
            <div className="mx-4 mb-3 flex items-start gap-2 text-xs">
              <span className="text-gray-500 font-medium shrink-0">with:</span>
              <div className="flex flex-wrap gap-1.5">
                {collaborators.map((c, i) => {
                  const style = getRelationStyle(c.relations);
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {c.name}
                      {style.label && (
                        <span className="opacity-75">({style.label})</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* THIS WEEK TASKS */}
          {thisWeekTasks.length > 0 && (
            <div className="mx-4 mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                THIS WEEK TASKS:
              </div>
              <ul className="space-y-1">
                {thisWeekTasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-700"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="flex-1">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pastWeekTasks.length === 0 && thisWeekTasks.length === 0 && (
            <p className="mx-4 mb-4 text-xs text-gray-400 text-center py-2">
              등록된 작업이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Entry 행 (리스트용)
function EntryRow({
  entry,
  onEdit,
}: {
  entry: SnapshotEntry;
  onEdit?: () => void;
}) {
  // 리스크 레벨
  const riskLevel = entry.risk_level || 0;
  const getRiskStyle = (level: number) => {
    if (level >= 3) return { bg: "bg-red-100", text: "text-red-600" };
    if (level >= 2) return { bg: "bg-orange-100", text: "text-orange-600" };
    if (level >= 1) return { bg: "bg-yellow-100", text: "text-yellow-600" };
    return null;
  };
  const riskStyle = getRiskStyle(riskLevel);

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
      {/* 태그 일렬 표시 */}
      <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
        {/* Domain */}
        {entry.domain && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-md shrink-0">
            {entry.domain}
          </span>
        )}
        {/* Project */}
        {entry.project && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-md shrink-0">
            {entry.project}
          </span>
        )}
        {/* Module */}
        {entry.module && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded-md shrink-0">
            {entry.module}
          </span>
        )}
        {/* Feature */}
        {entry.feature && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-600 rounded-md shrink-0">
            {entry.feature}
          </span>
        )}
        {/* Risk */}
        {riskStyle && (
          <span
            className={`px-2 py-0.5 text-[10px] font-medium ${riskStyle.bg} ${riskStyle.text} rounded-md shrink-0`}
          >
            Risk Lv.{riskLevel}
          </span>
        )}
      </div>

      {/* 편집 버튼 */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
          title="편집하기"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {/* 화살표 */}
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}

// 로딩 스켈레톤
function LoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 bg-gray-100 rounded-xl animate-pulse"
            style={{ height: 160 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// 빈 상태
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gray-100 rounded-2xl">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        스냅샷이 없습니다
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        선택한 주차에 작성된 스냅샷이 없습니다.
        <br />
        우측 상단의 &quot;새로 작성하기&quot; 버튼으로 시작하세요.
      </p>
    </div>
  );
}
