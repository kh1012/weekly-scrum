export default function PlansLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="w-32 h-10 rounded-lg bg-gray-200" />
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* 필터 스켈레톤 */}
      <div className="h-14 rounded-xl bg-gray-100" />

      {/* 리스트 스켈레톤 */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl"
            style={{ background: "var(--notion-bg-elevated)" }}
          />
        ))}
      </div>
    </div>
  );
}

