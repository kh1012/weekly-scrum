"use client";

interface MonthSelectorProps {
  selectedMonth: string; // YYYY-MM
  onChange: (month: string) => void;
}

/**
 * 월 선택기 컴포넌트
 */
export function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const date = new Date(year, month - 1);

  const goToPreviousMonth = () => {
    const prev = new Date(year, month - 2);
    onChange(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const goToNextMonth = () => {
    const next = new Date(year, month);
    onChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const goToToday = () => {
    const now = new Date();
    onChange(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const monthLabel = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPreviousMonth}
        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
        style={{ color: "var(--notion-text-muted)" }}
        aria-label="이전 월"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToToday}
        className="px-4 py-2 rounded-lg font-medium min-w-[140px] text-center transition-colors hover:bg-gray-100"
        style={{ color: "var(--notion-text)" }}
      >
        {monthLabel}
      </button>

      <button
        onClick={goToNextMonth}
        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
        style={{ color: "var(--notion-text-muted)" }}
        aria-label="다음 월"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
