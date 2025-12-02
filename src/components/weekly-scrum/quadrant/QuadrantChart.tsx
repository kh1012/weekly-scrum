"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from "recharts";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { getDomainColor, getRiskLevelColor, getProgressColor } from "@/lib/colorDefines";

interface QuadrantChartProps {
  data: ScrumItem[];
}

interface ChartDataPoint {
  x: number;
  y: number;
  item: ScrumItem;
}

// X축: 진행률 (0% → -50, 50% → 0, 100% → +50)
// 100%에 가까울수록 오른쪽(+), 0%에 가까울수록 왼쪽(-)
function calculateX(item: ScrumItem): number {
  return item.progressPercent - 50;
}

// Y축: 리스크 강도 (리스크 낮을수록 위쪽)
// Lv.0 → +40, Lv.1 → +15, Lv.2 → -15, Lv.3 → -40
function calculateY(item: ScrumItem): number {
  const riskLevel = item.riskLevel ?? 0;
  // 리스크 없음(0) = 위쪽, 심각(3) = 아래쪽
  return 40 - riskLevel * 25;
}

// 사분면 배경색
const QUADRANT_COLORS = {
  q1: "#e6f4ea", // 1사분면: 진행 양호 & 리스크 낮음 (녹색)
  q2: "#fff8e1", // 2사분면: 진행 지연 & 리스크 낮음 (노란색)
  q3: "#ffebee", // 3사분면: 진행 지연 & 리스크 높음 (빨간색)
  q4: "#fff3e0", // 4사분면: 진행 양호 & 리스크 높음 (주황색)
};

// 사분면 라벨
const QUADRANT_LABELS = {
  q1: { title: "양호", desc: "진행 양호 & 리스크 낮음" },
  q2: { title: "관찰", desc: "진행 지연 & 리스크 낮음" },
  q3: { title: "위험", desc: "진행 지연 & 리스크 높음" },
  q4: { title: "주의", desc: "진행 양호 & 리스크 높음" },
};

// 도메인별 마커 색상 가져오기
function getMarkerColor(domain: string): string {
  return getDomainColor(domain).text;
}

// 커스텀 툴팁 컴포넌트
interface CustomTooltipProps {
  item: ScrumItem;
  position: { x: number; y: number };
}

function CustomTooltip({ item, position }: CustomTooltipProps) {
  const domainColor = getDomainColor(item.domain);
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = getRiskLevelColor(riskLevel);
  const planPercent = item.planPercent ?? item.progressPercent;
  const progressDiff = item.progressPercent - planPercent;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-[#1f2328] text-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[360px]">
        {/* 헤더: 이름, 도메인 */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#3d444d]">
          <span className="text-sm font-bold text-white">{item.name}</span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold"
            style={{ background: domainColor.bg, color: domainColor.text }}
          >
            {item.domain}
          </span>
        </div>

        {/* 프로젝트 / 토픽 */}
        <div className="mb-3">
          <div className="text-xs text-[#8c959f] mb-1">프로젝트</div>
          <div className="text-sm text-white">{item.project}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-[#8c959f] mb-1">토픽</div>
          <div className="text-sm text-white leading-relaxed">{item.topic}</div>
        </div>

        {/* 진행률 */}
        <div className="mb-3 p-2 rounded bg-[#2d333b]">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#8c959f]">계획</span>
              <span className="font-semibold text-white">{planPercent}%</span>
            </div>
            <span className="text-[#8c959f]">→</span>
            <div className="flex items-center gap-2">
              <span className="text-[#8c959f]">진행</span>
              <span
                className="font-semibold"
                style={{ color: getProgressColor(item.progressPercent) }}
              >
                {item.progressPercent}%
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${progressDiff >= 0 ? "text-[#1a7f37]" : "text-[#cf222e]"}`}
            >
              ({progressDiff >= 0 ? "+" : ""}{progressDiff}%)
            </span>
          </div>
        </div>

        {/* 사유 */}
        {item.reason && item.reason.trim() !== "" && (
          <div className="mb-3">
            <div className="text-xs text-[#9a6700] mb-1">계획 대비 미비 사유</div>
            <div
              className="text-sm pl-2 border-l-2"
              style={{ borderColor: "#9a6700", color: "#9a6700" }}
            >
              {item.reason}
            </div>
          </div>
        )}

        {/* 리스크 */}
        {riskLevel > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: riskColor.text, color: "white" }}
              >
                Lv.{riskLevel} {riskColor.label}
              </span>
              <span className="text-xs text-[#8c959f]">{riskColor.description}</span>
            </div>
            {item.risk && item.risk.trim() !== "" && (
              <div
                className="text-sm pl-2 border-l-2 mt-1"
                style={{ borderColor: riskColor.text, color: riskColor.text }}
              >
                {item.risk}
              </div>
            )}
          </div>
        )}

        {/* Next */}
        <div className="pt-2 border-t border-[#3d444d]">
          <div className="text-xs text-[#8c959f] mb-1">다음 계획</div>
          <div className="text-sm text-[#1a7f37] leading-relaxed">{item.next}</div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1f2328]" />
    </div>,
    document.body
  );
}

// 커스텀 도트 컴포넌트
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  selectedItem: ScrumItem | null;
  onClick: (item: ScrumItem, pos: { x: number; y: number }) => void;
}

function CustomDot({ cx, cy, payload, selectedItem, onClick }: CustomDotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  if (!cx || !cy || !payload) return null;

  const item = payload.item;
  const color = getMarkerColor(item.domain);
  const riskLevel = item.riskLevel ?? 0;
  const baseSize = riskLevel >= 2 ? 10 : 8;
  const isSelected = selectedItem?.topic === item.topic && selectedItem?.name === item.name;
  const size = isSelected ? baseSize + 3 : baseSize;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={color}
        stroke={isSelected ? "#1f2328" : "#fff"}
        strokeWidth={isSelected ? 3 : 2}
        style={{ 
          cursor: "pointer", 
          filter: isSelected 
            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" 
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
          transition: "all 0.15s ease-out",
        }}
        onMouseEnter={(e) => {
          const rect = (e.target as SVGCircleElement).getBoundingClientRect();
          setHoverPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
          setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          const rect = (e.target as SVGCircleElement).getBoundingClientRect();
          onClick(item, { x: rect.left + rect.width / 2, y: rect.top - 8 });
        }}
      />
      {/* Hover 시 이름만 표시 (선택되지 않은 경우만) */}
      {isHovered && !isSelected && createPortal(
        <div
          className="fixed z-[9998] pointer-events-none"
          style={{
            left: hoverPos.x,
            top: hoverPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-[#1f2328] text-white text-xs font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {item.name}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#1f2328]" />
        </div>,
        document.body
      )}
    </>
  );
}

export function QuadrantChart({ data }: QuadrantChartProps) {
  const [selectedItem, setSelectedItem] = useState<ScrumItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 데이터 변환
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((item) => ({
      x: calculateX(item),
      y: calculateY(item),
      item,
    }));
  }, [data]);

  // X, Y 축 범위 계산
  const xDomain = useMemo(() => {
    const xValues = chartData.map((d) => d.x);
    const minX = Math.min(-50, ...xValues);
    const maxX = Math.max(50, ...xValues);
    return [Math.floor(minX / 10) * 10 - 10, Math.ceil(maxX / 10) * 10 + 10];
  }, [chartData]);

  const yDomain = [-70, 70]; // 고정 범위

  // 점 클릭 핸들러
  const handleClick = (item: ScrumItem, pos: { x: number; y: number }) => {
    // 같은 항목 클릭 시 토글
    if (selectedItem?.topic === item.topic && selectedItem?.name === item.name) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setTooltipPos(pos);
    }
  };

  // 차트 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chartContainerRef.current && !chartContainerRef.current.contains(e.target as Node)) {
        setSelectedItem(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 사분면별 항목 수 계산
  const quadrantCounts = useMemo(() => {
    return chartData.reduce(
      (acc, point) => {
        if (point.x >= 0 && point.y >= 0) acc.q1++;
        else if (point.x < 0 && point.y >= 0) acc.q2++;
        else if (point.x < 0 && point.y < 0) acc.q3++;
        else if (point.x >= 0 && point.y < 0) acc.q4++;
        return acc;
      },
      { q1: 0, q2: 0, q3: 0, q4: 0 }
    );
  }, [chartData]);

  return (
    <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-[#d0d7de] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#1f2328]">업무 사분면 차트</h2>
          <p className="text-xs text-[#656d76] mt-0.5">진행률(X) vs 리스크(Y)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: QUADRANT_COLORS.q1 }} />
            <span className="text-[#656d76]">양호 {quadrantCounts.q1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: QUADRANT_COLORS.q2 }} />
            <span className="text-[#656d76]">관찰 {quadrantCounts.q2}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: QUADRANT_COLORS.q4 }} />
            <span className="text-[#656d76]">주의 {quadrantCounts.q4}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: QUADRANT_COLORS.q3 }} />
            <span className="text-[#656d76]">위험 {quadrantCounts.q3}</span>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="p-4" ref={chartContainerRef}>
        <div className="relative" style={{ height: "500px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
              {/* 사분면 배경 영역 */}
              {/* Q1: 우상단 (X+, Y+) */}
              <ReferenceArea
                x1={0}
                x2={xDomain[1]}
                y1={0}
                y2={yDomain[1]}
                fill={QUADRANT_COLORS.q1}
                fillOpacity={0.6}
              />
              {/* Q2: 좌상단 (X-, Y+) */}
              <ReferenceArea
                x1={xDomain[0]}
                x2={0}
                y1={0}
                y2={yDomain[1]}
                fill={QUADRANT_COLORS.q2}
                fillOpacity={0.6}
              />
              {/* Q3: 좌하단 (X-, Y-) */}
              <ReferenceArea
                x1={xDomain[0]}
                x2={0}
                y1={yDomain[0]}
                y2={0}
                fill={QUADRANT_COLORS.q3}
                fillOpacity={0.6}
              />
              {/* Q4: 우하단 (X+, Y-) */}
              <ReferenceArea
                x1={0}
                x2={xDomain[1]}
                y1={yDomain[0]}
                y2={0}
                fill={QUADRANT_COLORS.q4}
                fillOpacity={0.6}
              />

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              {/* 축 라인 */}
              <ReferenceLine x={0} stroke="#1f2328" strokeWidth={1.5} />
              <ReferenceLine y={0} stroke="#1f2328" strokeWidth={1.5} />

              <XAxis
                type="number"
                dataKey="x"
                domain={xDomain}
                tick={{ fontSize: 11, fill: "#656d76" }}
                tickLine={{ stroke: "#d0d7de" }}
                axisLine={{ stroke: "#d0d7de" }}
                label={{
                  value: "진행률 (0% ← → 100%)",
                  position: "bottom",
                  offset: 10,
                  style: { fontSize: 11, fill: "#656d76" },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={yDomain}
                tick={{ fontSize: 11, fill: "#656d76" }}
                tickLine={{ stroke: "#d0d7de" }}
                axisLine={{ stroke: "#d0d7de" }}
                label={{
                  value: "리스크 강도",
                  angle: -90,
                  position: "left",
                  offset: 10,
                  style: { fontSize: 11, fill: "#656d76" },
                }}
              />

              <Scatter
                data={chartData}
                shape={(props: { cx?: number; cy?: number; payload?: ChartDataPoint }) => <CustomDot {...props} selectedItem={selectedItem} onClick={handleClick} />}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* 사분면 라벨 */}
          <div className="absolute top-12 right-12 text-xs font-semibold text-[#1a7f37] opacity-60">
            {QUADRANT_LABELS.q1.title}
          </div>
          <div className="absolute top-12 left-12 text-xs font-semibold text-[#9a6700] opacity-60">
            {QUADRANT_LABELS.q2.title}
          </div>
          <div className="absolute bottom-12 left-12 text-xs font-semibold text-[#cf222e] opacity-60">
            {QUADRANT_LABELS.q3.title}
          </div>
          <div className="absolute bottom-12 right-12 text-xs font-semibold text-[#bc4c00] opacity-60">
            {QUADRANT_LABELS.q4.title}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="px-4 py-3 border-t border-[#d0d7de] bg-[#f6f8fa]">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#656d76]">
          <span className="font-semibold text-[#1f2328]">X축:</span>
          <span>← 0%</span>
          <span>100% →</span>
          <span className="text-[#d0d7de]">|</span>
          <span className="font-semibold text-[#1f2328]">Y축:</span>
          <span>↑ 리스크 없음</span>
          <span>↓ 리스크 심각</span>
          <span className="text-[#d0d7de]">|</span>
          <span className="font-semibold text-[#1f2328]">점 크기:</span>
          <span>리스크 Lv.2+ = 큰 점</span>
        </div>
      </div>

      {/* 툴팁 */}
      {selectedItem && <CustomTooltip item={selectedItem} position={tooltipPos} />}
    </div>
  );
}
