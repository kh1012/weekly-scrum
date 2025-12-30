"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface DateRangePickerProps {
  startDate: string | undefined; // YYYY-MM-DD format
  endDate: string | undefined; // YYYY-MM-DD format
  onStartDateChange: (date: string | undefined) => void;
  onEndDateChange: (date: string | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // 현재 보여줄 년월 상태
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) {
      return parseInt(startDate.split("-")[0]);
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) {
      return parseInt(startDate.split("-")[1]);
    }
    return new Date().getMonth() + 1;
  });

  // 드롭다운 위치 계산
  const calculatePosition = useCallback(() => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 380;

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
        width: `${Math.max(buttonRect.width, 320)}px`,
        maxHeight: `${Math.min(dropdownHeight, maxHeight)}px`,
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

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

  // 캘린더 날짜 데이터 생성
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (selectingStart) {
      onStartDateChange(dateStr);
      onEndDateChange(undefined);
      setSelectingStart(false);
    } else {
      if (startDate && dateStr < startDate) {
        // 종료일이 시작일보다 이전이면 시작일로 설정
        onStartDateChange(dateStr);
        onEndDateChange(undefined);
      } else {
        onEndDateChange(dateStr);
        setIsOpen(false);
        setSelectingStart(true);
      }
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleClear = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    setSelectingStart(true);
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    if (selectingStart) {
      onStartDateChange(todayStr);
      setSelectingStart(false);
    } else {
      if (startDate && todayStr < startDate) {
        onStartDateChange(todayStr);
        onEndDateChange(undefined);
      } else {
        onEndDateChange(todayStr);
        setIsOpen(false);
        setSelectingStart(true);
      }
    }
  };

  const isDateInRange = (dateStr: string): boolean => {
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isDateStart = (dateStr: string): boolean => {
    return dateStr === startDate;
  };

  const isDateEnd = (dateStr: string): boolean => {
    return dateStr === endDate;
  };

  const formatDisplayDate = (date: string | undefined) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${year}.${month}.${day}`;
  };

  const displayText = startDate && endDate
    ? `${formatDisplayDate(startDate)} ~ ${formatDisplayDate(endDate)}`
    : startDate
    ? `${formatDisplayDate(startDate)} ~ 종료일 선택`
    : "날짜 범위 선택";

  const calendarDays = generateCalendar();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between border border-[#d0d7de] rounded-md px-3 py-2 text-sm bg-white transition-all duration-200 ${
          isOpen
            ? "ring-2 ring-[#0969da] border-[#0969da]"
            : "hover:border-[#8c959f]"
        } ${className}`}
      >
        <span className={startDate ? "text-[#24292f]" : "text-[#57606a]"}>
          {displayText}
        </span>
        <svg
          className="w-4 h-4 text-[#57606a]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="rounded-md shadow-lg border border-[#d0d7de] bg-white overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={dropdownStyle}
          >
            {/* 헤더 */}
            <div className="p-3 border-b border-[#d0d7de] bg-[#f6f8fa]">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-[#eaeef2] rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-semibold text-[#24292f]">
                  {viewYear}년 {viewMonth}월
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-[#eaeef2] rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-[#57606a] text-center">
                {selectingStart ? "시작일을 선택하세요" : "종료일을 선택하세요"}
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-0 p-2 border-b border-[#d0d7de] bg-[#f6f8fa]">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                <div
                  key={day}
                  className={`text-center text-xs font-medium py-1 ${
                    idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-[#57606a]"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-0 p-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isInRange = isDateInRange(dateStr);
                const isStart = isDateStart(dateStr);
                const isEnd = isDateEnd(dateStr);
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square flex items-center justify-center text-sm transition-colors relative ${
                      isStart || isEnd
                        ? "bg-[#0969da] text-white font-semibold rounded"
                        : isInRange
                        ? "bg-[#ddf4ff] text-[#0969da]"
                        : isToday
                        ? "border border-[#0969da] text-[#0969da] rounded"
                        : "text-[#24292f] hover:bg-[#f6f8fa] rounded"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* 푸터 */}
            <div className="p-2 border-t border-[#d0d7de] flex gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-[#0969da] hover:bg-[#ddf4ff] rounded transition-colors"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-[#57606a] hover:bg-[#f6f8fa] rounded transition-colors"
              >
                초기화
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

