import { SkeletonCard } from "@/components/weekly-scrum/common";

/**
 * Admin Plans 페이지 로딩 상태
 */
export default function PlansLoading() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg animate-pulse"
            style={{ background: "var(--notion-border)" }}
          />
          <div className="space-y-2">
            <div
              className="h-5 w-24 rounded animate-pulse"
              style={{ background: "var(--notion-border)" }}
            />
            <div
              className="h-3 w-36 rounded animate-pulse"
              style={{ background: "var(--notion-border)" }}
            />
          </div>
        </div>
        <div
          className="h-10 w-24 rounded-xl animate-pulse"
          style={{ background: "var(--notion-border)" }}
        />
      </div>

      {/* 카드 스켈레톤 */}
      <SkeletonCard count={5} />
    </div>
  );
}

