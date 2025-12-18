"use client";

/**
 * 대시보드 로딩 스켈레톤
 * 
 * PersonalDashboard의 레이아웃을 반영한 스켈레톤 UI
 * - 상단 헤더 영역
 * - 7개 통계 카드 그리드
 * - 메인 히어로 카드
 * - 2열 서브 카드
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* 헤더 스켈레톤 */}
        <div className="mb-10 animate-pulse">
          <div className="h-10 w-72 bg-gray-200 rounded-lg mb-3" />
          <div className="h-5 w-56 bg-gray-100 rounded-lg" />
        </div>

        {/* 통계 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          {Array.from({ length: 7 }).map((_, i) => (
            <StatCardSkeleton key={i} delay={i * 0.05} />
          ))}
        </div>

        {/* 메인 카드 스켈레톤 */}
        <div className="space-y-6">
          <HeroCardSkeleton />

          {/* 서브 카드 스켈레톤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SubCardSkeleton delay={0.1} />
            <SubCardSkeleton delay={0.15} />
          </div>
        </div>

        {/* 하단 영역 스켈레톤 */}
        <div className="mt-16 py-8 border-t border-gray-100">
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="h-4 w-64 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-50 rounded" />
          </div>
        </div>
      </div>

      {/* 중앙 로딩 오버레이 */}
      <LoadingOverlay />
    </div>
  );
}

/** 통계 카드 스켈레톤 */
function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="relative p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30 overflow-hidden animate-pulse"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* 배경 그라데이션 원 */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gray-200 opacity-30" />

      <div className="relative">
        <div className="h-7 w-12 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/** 히어로 카드 스켈레톤 */
function HeroCardSkeleton() {
  return (
    <div className="relative w-full p-8 rounded-[2rem] overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
      {/* 움직이는 그라데이션 원 */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
      <div className="absolute top-10 right-40 w-32 h-32 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          {/* 뱃지 */}
          <div className="inline-flex h-8 w-32 rounded-full bg-white/30 mb-4" />

          {/* 타이틀 */}
          <div className="h-8 w-48 bg-white/40 rounded-lg mb-3" />

          {/* 설명 */}
          <div className="space-y-2 max-w-md">
            <div className="h-4 w-full bg-white/30 rounded" />
            <div className="h-4 w-3/4 bg-white/30 rounded" />
          </div>
        </div>

        {/* 화살표 버튼 */}
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/30" />
      </div>
    </div>
  );
}

/** 서브 카드 스켈레톤 */
function SubCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="relative w-full p-6 rounded-3xl bg-white border border-gray-100 overflow-hidden animate-pulse"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative flex items-start gap-4">
        {/* 아이콘 */}
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-gray-200" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-28 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 w-44 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/** 로딩 오버레이 (프로그레스 스피너) */
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* 로고 애니메이션 */}
        <div className="w-12 h-12 animate-pulse">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-lg"
          >
            <rect width="64" height="64" rx="12" fill="#F76D57" />
            <g transform="translate(3, 2) scale(0.9)">
              <path
                fill="#F9EBB2"
                d="M56,13.998c-1.237,0-2.387-0.375-3.343-1.018c-0.671-0.451-1.242-1.037-1.685-1.715
                c-0.055,0.82-0.352,1.564-0.825,2.174c-0.731,0.941-1.862,1.559-3.147,1.559c-0.839,0-1.616-0.262-2.26-0.703
                c-0.594-0.408-1.065-0.975-1.369-1.635c-0.328,0.658-0.772,1.248-1.309,1.742c-1.069,0.988-2.493,1.596-4.062,1.596
                c-1.583,0-3.02-0.619-4.092-1.619c-0.498-0.467-0.917-1.014-1.233-1.625c-0.429,0.533-0.948,0.986-1.532,1.348
                c-0.915,0.564-1.989,0.896-3.143,0.896c-2.048,0-3.854-1.029-4.937-2.596c-0.412-0.596-0.715-1.27-0.89-1.994
                c-0.437,0.572-1.015,1.027-1.693,1.299c-0.459,0.184-0.956,0.291-1.48,0.291c-2.209,0-4-1.791-4-4s1.791-4,4-4
                c0.839,0,1.616,0.26,2.26,0.703c0.594,0.406,1.065,0.975,1.369,1.637c0.327-0.662,0.771-1.25,1.308-1.746
                C25.006,3.605,26.431,2.998,28,2.998c1.583,0,3.02,0.617,4.092,1.619c0.498,0.467,0.917,1.014,1.233,1.623
                c0.429-0.531,0.948-0.986,1.532-1.348C35.772,4.328,36.846,3.998,38,3.998c0.445,0,0.878,0.053,1.296,0.145
                c0.675,0.148,1.305,0.412,1.873,0.768c0.188-0.66,0.524-1.26,0.996-1.732c0.725-0.729,1.727-1.18,2.835-1.18
                c1.729,0,3.188,1.104,3.747,2.641c0.08,0.221,0.145,0.449,0.185,0.684c0.503,0.17,0.978,0.402,1.41,0.693
                c0.143-0.406,0.326-0.791,0.548-1.15c1.056-1.719,2.946-2.867,5.11-2.867c3.313,0,6,2.686,6,6C62,11.311,59.313,13.998,56,13.998z"
              />
            </g>
            <rect x="16" y="22" width="32" height="38" rx="3" fill="#F76D57" />
            <line x1="26" y1="24" x2="26" y2="56" stroke="#394240" strokeWidth="2" />
            <line x1="32" y1="24" x2="32" y2="56" stroke="#394240" strokeWidth="2" />
            <line x1="38" y1="24" x2="38" y2="56" stroke="#394240" strokeWidth="2" />
          </svg>
        </div>
        
        {/* 스피너 */}
        <div
          className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{ color: "#F76D57" }}
        />
        
        {/* 로딩 텍스트 */}
        <p className="text-sm font-medium" style={{ color: "var(--notion-text-muted)" }}>
          대시보드 로딩 중...
        </p>
      </div>
    </div>
  );
}




