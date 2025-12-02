"use client";

import type { RiskItem, InsightRiskLevel } from "@/types/insight";

interface RiskTableProps {
  items: RiskItem[];
}

const RISK_LEVEL_STYLES: Record<InsightRiskLevel, { bg: string; text: string; label: string }> = {
  0: { bg: "#A5D6A7", text: "#1B5E20", label: "없음" },
  1: { bg: "#FFF59D", text: "#F57F17", label: "경미" },
  2: { bg: "#FFCC80", text: "#E65100", label: "중간" },
  3: { bg: "#EF9A9A", text: "#B71C1C", label: "심각" },
};

export function RiskTable({ items }: RiskTableProps) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
        <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Risk & Required Actions
        </h2>
        <p className="text-sm text-[#656d76]">리스크 항목이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Risk & Required Actions
      </h2>
      
      {/* 데스크탑 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d0d7de]">
              <th className="text-left py-2.5 px-3 font-medium text-[#656d76]">
                Risk / Reason
              </th>
              <th className="text-center py-2.5 px-3 font-medium text-[#656d76] w-24">
                Level
              </th>
              <th className="text-left py-2.5 px-3 font-medium text-[#656d76]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const style = RISK_LEVEL_STYLES[item.level];
              return (
                <tr
                  key={index}
                  className="border-b border-[#d8dee4] last:border-b-0 hover:bg-[#f6f8fa] transition-colors"
                >
                  <td className="py-3 px-3 text-[#1f2328]">
                    {item.item}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {item.level} - {style.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#656d76]">
                    {item.action}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => {
          const style = RISK_LEVEL_STYLES[item.level];
          return (
            <div
              key={index}
              className="p-3 border border-[#d8dee4] rounded-lg"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-[#1f2328] flex-1">
                  {item.item}
                </span>
                <span
                  className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
              </div>
              {item.action && (
                <div className="text-xs text-[#656d76] mt-2 pt-2 border-t border-[#d8dee4]">
                  <span className="font-medium">Action:</span> {item.action}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

