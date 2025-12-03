"use client";

interface ExecutiveSummaryProps {
  items: string[];
}

export function ExecutiveSummary({ items }: ExecutiveSummaryProps) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
        <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Executive Summary
        </h2>
        <p className="text-sm text-[#656d76]">요약 데이터가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Executive Summary
      </h2>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span 
              className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-slate-400"
              aria-hidden="true"
            />
            <span className="text-sm text-[#1f2328] leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}


