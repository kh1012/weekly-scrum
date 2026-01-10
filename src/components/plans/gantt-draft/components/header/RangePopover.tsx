"use client";

import { useState, useRef, useEffect } from "react";

interface RangePopoverProps {
  rangeMonths: number;
  rangeStart?: Date;
  rangeEnd?: Date;
  onRangeMonthsChange: (months: number) => void;
  onCustomRangeChange: (start: Date, end: Date) => void;
  onClose: () => void;
}

interface CustomDropdownProps {
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}

function CustomDropdown({ value, options, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
        style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
      >
        <span className="font-medium text-gray-700">
          {selectedOption?.label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                option.value === value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
              {option.value === value && (
                <span className="float-right text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RangePopover({
  rangeMonths,
  rangeStart,
  rangeEnd,
  onRangeMonthsChange,
  onCustomRangeChange,
}: RangePopoverProps) {
  const isCustomMode = rangeMonths === 0;
  const [activeTab, setActiveTab] = useState<"preset" | "custom">(
    isCustomMode ? "custom" : "preset"
  );

  const [customStartYear, setCustomStartYear] = useState(
    rangeStart ? rangeStart.getFullYear() : new Date().getFullYear()
  );
  const [customStartMonth, setCustomStartMonth] = useState(
    rangeStart ? rangeStart.getMonth() + 1 : new Date().getMonth() + 1
  );
  const [customEndYear, setCustomEndYear] = useState(
    rangeEnd ? rangeEnd.getFullYear() : new Date().getFullYear()
  );
  const [customEndMonth, setCustomEndMonth] = useState(
    rangeEnd ? rangeEnd.getMonth() + 1 : new Date().getMonth() + 1
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ].map((y) => ({
    value: y,
    label: `${y}년`,
  }));
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}월`,
  }));

  const handleApplyCustomRange = () => {
    const start = new Date(
      customStartYear,
      customStartMonth - 1,
      1,
      0,
      0,
      0,
      0
    );
    const end = new Date(customEndYear, customEndMonth, 0, 0, 0, 0, 0);
    onCustomRangeChange(start, end);
  };

  return (
    <div
      className="absolute top-full left-0 mt-2 rounded-xl shadow-xl z-50"
      style={{
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        minWidth: 280,
      }}
    >
      <div
        className="flex border-b rounded-t-xl overflow-hidden"
        style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}
      >
        <button
          onClick={() => setActiveTab("preset")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === "preset"
              ? "text-blue-600 border-b border-blue-500 bg-blue-50/50"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          기본 기간
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
            activeTab === "custom"
              ? "text-blue-600 border-b border-blue-500 bg-blue-50/50"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          직접 선택
        </button>
      </div>

      <div className="p-3">
        {activeTab === "preset" ? (
          <>
            <div className="text-xs font-semibold text-gray-500 mb-2 px-1">
              표시 기간 선택
            </div>
            <div className="space-y-1">
              {[3, 4, 5, 6].map((m) => {
                const isSelected = rangeMonths === m;
                return (
                  <button
                    key={m}
                    onClick={() => onRangeMonthsChange(m)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{m}개월</span>
                    {isSelected && <span className="text-blue-500">✓</span>}
                  </button>
                );
              })}
            </div>
            {isCustomMode && (
              <div
                className="mt-3 pt-3 text-xs text-amber-600 text-center font-medium"
                style={{ borderTop: "1px solid #e5e7eb" }}
              >
                ⚠️ 현재 직접 선택 모드 사용 중
              </div>
            )}
            {!isCustomMode && (
              <div
                className="mt-3 pt-3 text-xs text-gray-400 text-center"
                style={{ borderTop: "1px solid #e5e7eb" }}
              >
                현재 기준 전후 기간 표시
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  시작월
                </label>
                <div className="flex gap-2">
                  <CustomDropdown
                    value={customStartYear}
                    options={yearOptions}
                    onChange={setCustomStartYear}
                  />
                  <CustomDropdown
                    value={customStartMonth}
                    options={monthOptions}
                    onChange={setCustomStartMonth}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  종료월
                </label>
                <div className="flex gap-2">
                  <CustomDropdown
                    value={customEndYear}
                    options={yearOptions}
                    onChange={setCustomEndYear}
                  />
                  <CustomDropdown
                    value={customEndMonth}
                    options={monthOptions}
                    onChange={setCustomEndMonth}
                  />
                </div>
              </div>

              <button
                onClick={handleApplyCustomRange}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                적용
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
