"use client";

interface MatrixHeaderProps {
  members: number;
  projects: number;
  isFullscreen?: boolean;
}

export function MatrixHeader({
  members,
  projects,
  isFullscreen = false,
}: MatrixHeaderProps) {
  const handleOpenFullscreen = () => {
    window.open("/matrix?fullscreen=true", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center justify-between p-2 border-b border-[#d0d7de] bg-[#f6f8fa] rounded-t-md">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[#656d76]">
          팀원 × 프로젝트 매트릭스
        </span>
        <span className="text-[10px] text-[#8c959f]">
          ({members}명 × {projects}개 프로젝트)
        </span>
      </div>
      {!isFullscreen && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md border border-[#d0d7de] bg-white hover:bg-[#f6f8fa] transition-colors"
            title="새 창에서 전체화면으로 보기"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            새 창 열기
          </button>
        </div>
      )}
    </div>
  );
}

export function MatrixLegend({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div className="p-2 border-t border-[#d0d7de] bg-[#f6f8fa] rounded-b-md">
      <div className="flex items-center gap-3 text-[10px] text-[#656d76] flex-wrap">
        <span className="font-medium">진행률:</span>
        <LegendItem color="#dafbe1" border="#1a7f37" label="완료" />
        <LegendItem color="#ddf4ff" border="#0969da" label="70%+" />
        <LegendItem color="#fff8c5" border="#9a6700" label="40-70%" />
        <LegendItem color="#ffebe9" border="#cf222e" label="<40%" />
        {!isExpanded && (
          <span className="ml-2 text-[#8c959f]">
            · 셀 호버 시 상세 정보 표시
          </span>
        )}
      </div>
    </div>
  );
}

function LegendItem({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="w-2.5 h-2.5 rounded"
        style={{ backgroundColor: color, border: `1px solid ${border}` }}
      />
      {label}
    </span>
  );
}
