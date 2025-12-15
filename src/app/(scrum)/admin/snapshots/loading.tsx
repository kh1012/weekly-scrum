import { SkeletonCard } from "@/components/weekly-scrum/common";

/**
 * Admin Snapshots 페이지 로딩 상태
 */
export default function SnapshotsLoading() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg animate-pulse"
          style={{ background: "var(--notion-border)" }}
        />
        <div className="space-y-2">
          <div
            className="h-5 w-32 rounded animate-pulse"
            style={{ background: "var(--notion-border)" }}
          />
          <div
            className="h-3 w-48 rounded animate-pulse"
            style={{ background: "var(--notion-border)" }}
          />
        </div>
      </div>

      {/* 카드 스켈레톤 */}
      <SkeletonCard count={5} />
    </div>
  );
}

