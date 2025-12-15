"use client";

/**
 * 스냅샷 목록 컴포넌트
 * - Pinterest 스타일 그리드 / 리스트 뷰 토글
 */

import type { SnapshotSummary } from "./SnapshotsMainView";

interface SnapshotListProps {
  snapshots: SnapshotSummary[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  onRefresh: () => void;
}

export function SnapshotList({
  snapshots,
  isLoading,
  viewMode,
}: SnapshotListProps) {
  // 로딩 중일 때는 기존 데이터를 유지하면서 보여줌 (프로그레스바가 상단에서 동작)
  // 데이터가 없고 로딩 중이 아닐 때만 EmptyState 표시
  if (!isLoading && snapshots.length === 0) {
    return <EmptyState />;
  }

  // 로딩 중이고 기존 데이터가 없으면 빈 상태 유지 (프로그레스바가 동작)
  if (isLoading && snapshots.length === 0) {
    return <EmptyState />;
  }

  if (viewMode === "grid") {
    return <GridView snapshots={snapshots} />;
  }

  return <ListView snapshots={snapshots} />;
}

// 그리드 뷰 (Pinterest 스타일)
function GridView({ snapshots }: { snapshots: SnapshotSummary[] }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {snapshots.map((snapshot) => (
        <SnapshotCard key={snapshot.id} snapshot={snapshot} />
      ))}
    </div>
  );
}

// 리스트 뷰
function ListView({ snapshots }: { snapshots: SnapshotSummary[] }) {
  return (
    <div className="space-y-2">
      {snapshots.map((snapshot) => (
        <SnapshotRow key={snapshot.id} snapshot={snapshot} />
      ))}
    </div>
  );
}

// 스냅샷 카드 (그리드용)
function SnapshotCard({ snapshot }: { snapshot: SnapshotSummary }) {
  const title = snapshot.title || `스냅샷 ${snapshot.id.slice(0, 8)}`;
  const createdAt = new Date(snapshot.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 고유 프로젝트/모듈/기능 추출
  const projects = [...new Set(snapshot.entries.map((e) => e.project))];
  const modules = [...new Set(snapshot.entries.map((e) => e.module).filter(Boolean))];

  return (
    <div className="break-inside-avoid mb-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{createdAt}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
          <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium text-gray-600">{snapshot.entriesCount}</span>
        </div>
      </div>

      {/* 프로젝트 배지 */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {projects.slice(0, 3).map((project) => (
            <span
              key={project}
              className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md"
            >
              {project}
            </span>
          ))}
          {projects.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{projects.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 모듈 배지 */}
      {modules.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {modules.slice(0, 4).map((module) => (
            <span
              key={module}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md"
            >
              {module}
            </span>
          ))}
          {modules.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{modules.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// 스냅샷 행 (리스트용)
function SnapshotRow({ snapshot }: { snapshot: SnapshotSummary }) {
  const title = snapshot.title || `스냅샷 ${snapshot.id.slice(0, 8)}`;
  const createdAt = new Date(snapshot.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const updatedAt = new Date(snapshot.updated_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const projects = [...new Set(snapshot.entries.map((e) => e.project))];

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group">
      {/* 아이콘 */}
      <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      {/* 제목 & 메타 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700">
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span>생성: {createdAt}</span>
          <span>수정: {updatedAt}</span>
        </div>
      </div>

      {/* 프로젝트 */}
      <div className="hidden md:flex items-center gap-1.5">
        {projects.slice(0, 2).map((project) => (
          <span
            key={project}
            className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md"
          >
            {project}
          </span>
        ))}
        {projects.length > 2 && (
          <span className="text-xs text-gray-400">+{projects.length - 2}</span>
        )}
      </div>

      {/* 엔트리 수 */}
      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
        <span className="text-sm font-medium text-gray-700">{snapshot.entriesCount}</span>
        <span className="text-xs text-gray-500">entries</span>
      </div>

      {/* 화살표 */}
      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// 로딩 스켈레톤
function LoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 p-4 bg-gray-100 rounded-xl animate-pulse"
            style={{ height: 120 + (i % 3) * 40 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-16 bg-gray-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}

// 빈 상태
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gray-100 rounded-2xl">
        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        스냅샷이 없습니다
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        선택한 주차에 작성된 스냅샷이 없습니다.<br />
        우측 상단의 &quot;새로 작성하기&quot; 버튼으로 시작하세요.
      </p>
    </div>
  );
}

