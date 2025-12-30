"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, XIcon } from "@/components/common/Icons";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  startDate: string | undefined; // YYYY-MM-DD
  endDate: string | undefined; // YYYY-MM-DD
  onChange: (start: string | undefined, end: string | undefined) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = "날짜 범위 선택",
  className = "",
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return undefined;
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (startDate && endDate) {
      setRange({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    } else {
      setRange(undefined);
    }
  }, [startDate, endDate]);

  const formatDisplayDate = (date: Date) => {
    return format(date, "yyyy. MM. dd.", { locale: ko });
  };

  const displayText = React.useMemo(() => {
    if (range?.from && range?.to) {
      return `${formatDisplayDate(range.from)} ~ ${formatDisplayDate(
        range.to
      )}`;
    }
    if (range?.from) {
      return `${formatDisplayDate(range.from)} ~ (종료일 선택)`;
    }
    return placeholder;
  }, [range, placeholder]);

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    // 날짜 선택 시 바로 닫지 않고, 사용자가 확인 버튼을 누를 때까지 유지
  };

  const handleApply = () => {
    if (range?.from && range?.to) {
      const start = format(range.from, "yyyy-MM-dd");
      const end = format(range.to, "yyyy-MM-dd");
      onChange(start, end);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setRange(undefined);
    onChange(undefined, undefined);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    setRange({ from: today, to: today });
    onChange(todayString, todayString);
    setIsOpen(false);
  };

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 400;
      const isMobile = viewportWidth < 1024; // lg breakpoint

      if (isMobile) {
        // 모바일: 화면 중앙에 모달로 표시
        setDropdownStyle({
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 2rem)",
          maxWidth: "360px",
          zIndex: 9999,
        });
      } else {
        // 데스크톱: 버튼 아래에 표시
        let top = buttonRect.bottom + 4;
        let maxHeight = viewportHeight - buttonRect.bottom - 20;

        if (maxHeight < dropdownHeight && buttonRect.top > dropdownHeight) {
          top = buttonRect.top - dropdownHeight - 4;
          maxHeight = buttonRect.top - 20;
        }

        setDropdownStyle({
          position: "fixed",
          top: `${top}px`,
          left: `${buttonRect.left}px`,
          width: `auto`,
          zIndex: 9999,
        });
      }
    }
  }, [isOpen]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const disabledDays = React.useMemo(() => {
    const disabled: any[] = [];
    if (minDate) {
      disabled.push({ before: new Date(minDate) });
    }
    if (maxDate) {
      disabled.push({ after: new Date(maxDate) });
    }
    return disabled.length > 0 ? disabled : undefined;
  }, [minDate, maxDate]);

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between border border-[#d0d7de] rounded-md px-3 py-2 text-sm bg-white transition-all duration-200 ${
          isOpen
            ? "ring-2 ring-[#0969da] border-[#0969da]"
            : "hover:border-[#8c959f]"
        }`}
      >
        <span className={range?.from ? "text-[#24292f]" : "text-[#57606a]"}>
          {displayText}
        </span>
        <CalendarIcon className="w-4 h-4 text-[#57606a]" />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* 모바일 overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          <div
            ref={dropdownRef}
            className="rounded-md shadow-lg border border-[#d0d7de] bg-white overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 p-4"
            style={dropdownStyle}
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #0969da;
                --rdp-background-color: #ddf4ff;
                margin: 0;
              }
              .rdp-months {
                justify-content: center;
              }
              .rdp-caption {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 40px;
                z-index: 1;
              }
              .rdp-caption_label {
                font-size: 14px;
                font-weight: 600;
                color: #24292f;
              }
              .rdp-nav {
                position: absolute;
                top: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                z-index: 2;
              }
              .rdp-nav_button {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.15s;
              }
              .rdp-nav_button:hover {
                background-color: #f6f8fa;
              }
              .rdp-head_cell {
                font-size: 12px;
                font-weight: 500;
                color: #57606a;
                text-transform: uppercase;
              }
              .rdp-cell {
                padding: 2px;
              }
              .rdp-day {
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.1s;
              }
              .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
                background-color: #f6f8fa;
              }
              .rdp-day_selected {
                background-color: var(--rdp-accent-color);
                color: white;
                font-weight: 600;
              }
              .rdp-day_today:not(.rdp-day_selected) {
                border: 1px solid var(--rdp-accent-color);
                font-weight: 600;
              }
              .rdp-day_disabled {
                color: #d0d7de;
                cursor: not-allowed;
              }
              .rdp-day_range_middle {
                background-color: var(--rdp-background-color);
                color: #0969da;
              }
            `}</style>

            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              locale={ko}
              disabled={disabledDays}
              numberOfMonths={1}
              defaultMonth={range?.from || new Date()}
            />

            {/* Footer */}
            <div className="border-t border-[#d0d7de] pt-3 mt-3 space-y-2">
              {/* 상태 메시지 */}
              <div className="text-xs text-gray-500 text-center">
                {!range?.from && "시작일을 선택하세요"}
                {range?.from && !range?.to && "종료일을 선택하세요"}
                {range?.from &&
                  range?.to &&
                  "선택 완료 - 확인 버튼을 눌러주세요"}
              </div>

              {/* 버튼 그룹 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors border border-[#d0d7de]"
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors border border-[#d0d7de]"
                >
                  초기화
                </button>
              </div>

              {/* 확인 버튼 */}
              <button
                type="button"
                onClick={handleApply}
                disabled={!range?.from || !range?.to}
                className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  range?.from && range?.to
                    ? "bg-[#0969da] text-white hover:bg-[#0860ca]"
                    : "bg-[#f6f8fa] text-[#8c959f] cursor-not-allowed"
                }`}
              >
                확인
              </button>
            </div>
          </div>
          </>,
          document.body
        )}
    </div>
  );
}
