"use client";

interface MatrixHeaderProps {
  members: number;
  projects: number;
  isFullscreen?: boolean;
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

const SCALE_OPTIONS = [
  { value: 0.75, label: "75%" },
  { value: 0.85, label: "85%" },
  { value: 1, label: "100%" },
  { value: 1.15, label: "115%" },
  { value: 1.25, label: "125%" },
  { value: 1.5, label: "150%" },
];

export function MatrixHeader({
  members,
  projects,
  isFullscreen = false,
  scale = 1,
  onScaleChange,
}: MatrixHeaderProps) {
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
      {!isFullscreen && onScaleChange && (
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <select
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            className="appearance-none px-2 py-1 pr-6 text-[10px] font-medium rounded-md border border-[#d0d7de] bg-white hover:bg-[#f6f8fa] focus:outline-none focus:border-blue-400 cursor-pointer transition-colors"
            title="배율 설정"
          >
            {SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
