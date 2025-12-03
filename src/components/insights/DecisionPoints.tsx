"use client";

interface DecisionPointsProps {
  items: string[];
}

export function DecisionPoints({ items }: DecisionPointsProps) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
        <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Decision Points
        </h2>
        <p className="text-sm text-[#656d76]">의사결정 항목이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Decision Points
      </h2>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-xs font-medium text-amber-700 bg-amber-100 rounded">
              {index + 1}
            </span>
            <span className="text-sm text-amber-900 leading-relaxed">
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}


