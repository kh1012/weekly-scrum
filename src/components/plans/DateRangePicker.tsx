"use client";

/**
 * DateRangePicker - 기간 설정 컴포넌트
 * 
 * 시작/종료 월을 선택하여 기간을 설정합니다.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@/components/common/Icons";

interface DateRangePickerProps {
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
  onChange: (startMonth: string, endMonth: string) => void;
}

export function DateRangePicker({
  startMonth,
  endMonth,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    parseInt(startMonth.split("-")[0])
  );
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState(startMonth);
  const [tempEnd, setTempEnd] = useState(endMonth);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const months = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  // 위치 계산
  const calculatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
      });
    }
  }, []);

  const handleOpen = () => {
    calculatePosition();
    setIsOpen(true);
    setTempStart(startMonth);
    setTempEnd(endMonth);
    setViewYear(parseInt(startMonth.split("-")[0]));
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // 월 선택
  const handleMonthClick = (month: number) => {
    const monthStr = `${viewYear}-${String(month).padStart(2, "0")}`;

    if (selecting === "start") {
      setTempStart(monthStr);
      if (monthStr > tempEnd) {
        setTempEnd(monthStr);
      }
      setSelecting("end");
    } else {
      if (monthStr >= tempStart) {
        setTempEnd(monthStr);
      } else {
        setTempStart(monthStr);
        setTempEnd(tempStart);
      }
    }
  };

  // 적용
  const handleApply = () => {
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  // 프리셋
  const handlePreset = (months: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + months - 1, 1);

    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;

    setTempStart(startStr);
    setTempEnd(endStr);
    onChange(startStr, endStr);
    setIsOpen(false);
  };

  // 월이 범위 내인지 확인
  const isInRange = (month: number) => {
    const monthStr = `${viewYear}-${String(month).padStart(2, "0")}`;
    return monthStr >= tempStart && monthStr <= tempEnd;
  };

  const isStart = (month: number) => {
    return `${viewYear}-${String(month).padStart(2, "0")}` === tempStart;
  };

  const isEnd = (month: number) => {
    return `${viewYear}-${String(month).padStart(2, "0")}` === tempEnd;
  };

  // 디스플레이 텍스트
  const formatDisplay = () => {
    const [startY, startM] = startMonth.split("-");
    const [endY, endM] = endMonth.split("-");

    if (startY === endY) {
      return `${startY}년 ${parseInt(startM)}월 ~ ${parseInt(endM)}월`;
    }
    return `${startY}년 ${parseInt(startM)}월 ~ ${endY}년 ${parseInt(endM)}월`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        style={{
          background: "var(--notion-bg-secondary)",
          border: "1px solid var(--notion-border)",
          color: "var(--notion-text)",
        }}
      >
        <CalendarIcon size={14} />
        <span>{formatDisplay()}</span>
        <ChevronDownIcon
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-xl shadow-xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
              }}
            >
              {/* 헤더 */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "var(--notion-border)" }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--notion-text)" }}
                >
                  기간 설정
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreset(3)}
                    className="px-2 py-1 text-xs rounded hover:bg-black/5"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    3개월
                  </button>
                  <button
                    onClick={() => handlePreset(6)}
                    className="px-2 py-1 text-xs rounded hover:bg-black/5"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    6개월
                  </button>
                  <button
                    onClick={() => handlePreset(12)}
                    className="px-2 py-1 text-xs rounded hover:bg-black/5"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    1년
                  </button>
                </div>
              </div>

              {/* 년도 선택 */}
              <div
                className="px-4 py-2 border-b flex items-center justify-between"
                style={{ borderColor: "var(--notion-border)" }}
              >
                <button
                  onClick={() => setViewYear((y) => y - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/5"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  <ChevronLeftIcon size={12} />
                </button>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--notion-text)" }}
                >
                  {viewYear}년
                </span>
                <button
                  onClick={() => setViewYear((y) => y + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/5"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  <ChevronRightIcon size={12} />
                </button>
              </div>

              {/* 월 그리드 */}
              <div className="p-3 grid grid-cols-4 gap-1.5" style={{ width: 280 }}>
                {months.map((name, i) => {
                  const month = i + 1;
                  const inRange = isInRange(month);
                  const start = isStart(month);
                  const end = isEnd(month);

                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthClick(month)}
                      className={`py-2.5 text-xs font-medium rounded-lg transition-all ${
                        start || end
                          ? "text-white"
                          : inRange
                            ? ""
                            : "hover:bg-black/5"
                      }`}
                      style={{
                        background:
                          start || end
                            ? "#F76D57"
                            : inRange
                              ? "rgba(247, 109, 87, 0.1)"
                              : "transparent",
                        color:
                          start || end
                            ? "white"
                            : inRange
                              ? "#F76D57"
                              : "var(--notion-text)",
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* 선택 상태 표시 */}
              <div
                className="px-4 py-2 border-t flex items-center justify-between text-xs"
                style={{
                  borderColor: "var(--notion-border)",
                  background: "var(--notion-bg-secondary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelecting("start")}
                    className={`px-2 py-1 rounded ${selecting === "start" ? "bg-[#F76D57]/10" : ""}`}
                    style={{
                      color: selecting === "start" ? "#F76D57" : "var(--notion-text-muted)",
                    }}
                  >
                    시작: {tempStart}
                  </button>
                  <span style={{ color: "var(--notion-text-muted)" }}>~</span>
                  <button
                    onClick={() => setSelecting("end")}
                    className={`px-2 py-1 rounded ${selecting === "end" ? "bg-[#F76D57]/10" : ""}`}
                    style={{
                      color: selecting === "end" ? "#F76D57" : "var(--notion-text-muted)",
                    }}
                  >
                    종료: {tempEnd}
                  </button>
                </div>
                <button
                  onClick={handleApply}
                  className="px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: "#F76D57" }}
                >
                  적용
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

