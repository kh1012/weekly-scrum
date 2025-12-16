"use client";

interface LoadingSpinnerProps {
  /** 스피너 크기 */
  size?: "sm" | "md" | "lg";
  /** 로딩 텍스트 */
  text?: string;
  /** 전체 화면 모드 */
  fullScreen?: boolean;
  /** 투명 배경 */
  transparent?: boolean;
}

const SIZE_MAP = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
};

/**
 * 통일된 로딩 스피너 컴포넌트
 */
export function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
  transparent = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${SIZE_MAP[size]} border-current border-t-transparent rounded-full animate-spin`}
        style={{ color: "#F76D57" }}
      />
      {text && (
        <p
          className="text-sm font-medium"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: transparent
            ? "rgba(255, 255, 255, 0.8)"
            : "var(--notion-bg)",
          backdropFilter: transparent ? "blur(4px)" : "none",
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">{spinner}</div>
  );
}

/**
 * 페이지 로딩용 스피너 (loading.tsx에서 사용)
 */
export function PageLoadingSpinner() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center"
      style={{ background: "var(--notion-bg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* 로고 애니메이션 */}
        <div className="w-12 h-12 animate-pulse">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
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
            <line
              x1="26"
              y1="24"
              x2="26"
              y2="56"
              stroke="#394240"
              strokeWidth="2"
            />
            <line
              x1="32"
              y1="24"
              x2="32"
              y2="56"
              stroke="#394240"
              strokeWidth="2"
            />
            <line
              x1="38"
              y1="24"
              x2="38"
              y2="56"
              stroke="#394240"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div
          className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{ color: "#F76D57" }}
        />
        <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
          로딩 중...
        </p>
      </div>
    </div>
  );
}

/**
 * 로고 회전 로딩 스피너 Props
 */
interface LogoLoadingSpinnerProps {
  /** 제목 */
  title?: string;
  /** 설명 */
  description?: string;
  /** 컨테이너 className (기본: h-full) */
  className?: string;
}

/**
 * 로고 회전 로딩 스피너
 * - MIDAS 로고 SVG가 가속도 회전
 * - title, description 커스터마이징 가능
 */
export function LogoLoadingSpinner({
  title = "데이터를 불러오는 중입니다",
  description = "잠시만 기다려주세요.",
  className = "h-full",
}: LogoLoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 ${className}`}
    >
      <style>{`
        @keyframes spin-accelerate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-accelerate {
          animation: spin-accelerate 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="w-20 h-20 mb-6 flex items-center justify-center">
        <svg
          className="w-16 h-16 spin-accelerate"
          viewBox="0 0 640 640"
          fill="currentColor"
          style={{ color: "rgba(156, 163, 175, 0.4)" }}
        >
          <path d="M344 170.6C362.9 161.6 376 142.3 376 120C376 89.1 350.9 64 320 64C289.1 64 264 89.1 264 120C264 142.3 277.1 161.6 296 170.6L296 269.4C293.2 270.7 290.5 272.3 288 274.1L207.9 228.3C209.5 207.5 199.3 186.7 180 175.5C153.2 160 119 169.2 103.5 196C88 222.8 97.2 257 124 272.5C125.3 273.3 126.6 274 128 274.6L128 365.4C126.7 366 125.3 366.7 124 367.5C97.2 383 88 417.2 103.5 444C119 470.8 153.2 480 180 464.5C199.3 453.4 209.4 432.5 207.8 411.7L258.3 382.8C246.8 371.6 238.4 357.2 234.5 341.1L184 370.1C181.4 368.3 178.8 366.8 176 365.4L176 274.6C178.8 273.3 181.5 271.7 184 269.9L264.1 315.7C264 317.1 263.9 318.5 263.9 320C263.9 342.3 277 361.6 295.9 370.6L295.9 469.4C277 478.4 263.9 497.7 263.9 520C263.9 550.9 289 576 319.9 576C350.8 576 375.9 550.9 375.9 520C375.9 497.7 362.8 478.4 343.9 469.4L343.9 370.6C346.7 369.3 349.4 367.7 351.9 365.9L432 411.7C430.4 432.5 440.6 453.3 459.8 464.5C486.6 480 520.8 470.8 536.3 444C551.8 417.2 542.6 383 515.8 367.5C514.5 366.7 513.1 366 511.8 365.4L511.8 274.6C513.2 274 514.5 273.3 515.8 272.5C542.6 257 551.8 222.8 536.3 196C520.8 169.2 486.8 160 460 175.5C440.7 186.6 430.6 207.5 432.2 228.3L381.6 257.2C393.1 268.4 401.5 282.8 405.4 298.9L456 269.9C458.6 271.7 461.2 273.2 464 274.6L464 365.4C461.2 366.7 458.5 368.3 456 370L375.9 324.2C376 322.8 376.1 321.4 376.1 319.9C376.1 297.6 363 278.3 344.1 269.3L344.1 170.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        {description}
      </p>
    </div>
  );
}

/**
 * 스켈레톤 카드 로더
 */
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl animate-pulse"
          style={{
            background: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg"
              style={{ background: "var(--notion-border)" }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded w-1/3"
                style={{ background: "var(--notion-border)" }}
              />
              <div
                className="h-3 rounded w-1/2"
                style={{ background: "var(--notion-border)" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
