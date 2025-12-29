"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  className = "",
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // 현재 보여줄 년월 상태
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      return parseInt(value.split("-")[1]);
    }
    return new Date().getMonth() + 1;
  });

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 320; // 예상 높이

      let top = buttonRect.bottom + 4;
      let maxHeight = viewportHeight - buttonRect.bottom - 20;

      // 아래쪽 공간이 부족하면 위쪽에 표시
      if (maxHeight < dropdownHeight && buttonRect.top > dropdownHeight) {
        top = buttonRect.top - dropdownHeight - 4;
        maxHeight = buttonRect.top - 20;
      }

      setDropdownStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${buttonRect.left}px`,
        width: `${Math.max(buttonRect.width, 280)}px`,
        maxHeight: `${Math.min(dropdownHeight, maxHeight)}px`,
        zIndex: 9999,
      });
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

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  // 해당 월의 날짜 배열 생성
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];

    // 앞쪽 빈칸
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    // minDate, maxDate 체크
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    setSelectedDate(dateStr);
    onChange(dateStr);
    setIsOpen(false);
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

  const handleToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDate(todayStr);
    onChange(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate("");
    onChange("");
    setIsOpen(false);
  };

  const days = getDaysInMonth(viewYear, viewMonth);
  const isDateDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() + 1 &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [year, month, dayStr] = selectedDate.split("-");
    return (
      viewYear === parseInt(year) &&
      viewMonth === parseInt(month) &&
      day === parseInt(dayStr)
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] bg-white hover:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da] transition-colors text-left flex items-center justify-between ${className}`}
      >
        <span className={selectedDate ? "text-[#24292f]" : "text-[#57606a]"}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <svg className="w-4 h-4 text-[#57606a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-[#d0d7de] rounded-md shadow-lg overflow-hidden"
          >
            {/* 헤더 */}
            <div className="px-3 py-2 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-[#d0d7de] rounded transition-colors"
              >
                <svg className="w-5 h-5 text-[#24292f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="font-semibold text-sm text-[#24292f]">
                {viewYear}년 {viewMonth}월
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-[#d0d7de] rounded transition-colors"
              >
                <svg className="w-5 h-5 text-[#24292f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs font-semibold text-[#57606a] bg-[#f6f8fa]">
              <div>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div>토</div>
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1 p-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={day === null || isDateDisabled(day)}
                  onClick={() => day !== null && handleDateClick(day)}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded transition-colors
                    ${day === null ? "invisible" : ""}
                    ${day !== null && isDateDisabled(day) ? "text-[#8c959f] cursor-not-allowed opacity-50" : ""}
                    ${day !== null && !isDateDisabled(day) && isSelected(day) ? "bg-[#0969da] text-white font-semibold" : ""}
                    ${day !== null && !isDateDisabled(day) && !isSelected(day) && isToday(day) ? "bg-[#ddf4ff] text-[#0969da] font-semibold" : ""}
                    ${day !== null && !isDateDisabled(day) && !isSelected(day) && !isToday(day) ? "text-[#24292f] hover:bg-[#f6f8fa]" : ""}
                  `}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* 푸터 */}
            <div className="px-3 py-2 border-t border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 text-xs font-medium text-[#0969da] hover:bg-[#ddf4ff] rounded transition-colors"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 text-xs font-medium text-[#cf222e] hover:bg-[#ffebe9] rounded transition-colors"
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

