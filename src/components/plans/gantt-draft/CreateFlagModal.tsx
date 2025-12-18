/**
 * Create Flag Modal
 * - 더블클릭으로 선택한 기간에 Flag 생성
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, FlagIcon, CalendarIcon } from "@/components/common/Icons";
import { useDraftStore } from "./store";
import { formatDate } from "./laneLayout";

const FLAG_COLORS = [
  { value: "#ef4444", label: "빨강" },
  { value: "#f97316", label: "주황" },
  { value: "#eab308", label: "노랑" },
  { value: "#22c55e", label: "초록" },
  { value: "#3b82f6", label: "파랑" },
  { value: "#8b5cf6", label: "보라" },
  { value: "#ec4899", label: "분홍" },
  { value: "#6b7280", label: "회색" },
];

interface CreateFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateFlagModal({
  isOpen,
  onClose,
  workspaceId,
}: CreateFlagModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#ef4444");

  const pendingFlag = useDraftStore((s) => s.pendingFlag);
  const addFlag = useDraftStore((s) => s.addFlag);
  const clearPendingFlag = useDraftStore((s) => s.clearPendingFlag);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setColor("#ef4444");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    clearPendingFlag();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pendingFlag.start) return;

    const startDate = formatDate(pendingFlag.start);
    const endDate = pendingFlag.end
      ? formatDate(pendingFlag.end)
      : startDate;

    // 로컬 상태에만 추가 (저장 버튼 클릭 시 서버에 전송)
    addFlag({
      workspaceId,
      title: title.trim(),
      startDate,
      endDate,
      color,
    });

    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const isPointFlag = !pendingFlag.end || pendingFlag.start?.getTime() === pendingFlag.end?.getTime();

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: "linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
              }}
            >
              <FlagIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                새 Flag 추가
              </h2>
              <p className="text-[11px] text-gray-500">
                {isPointFlag ? "포인트 Flag" : "범위 Flag"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 날짜 정보 */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{
              background: "linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)",
              border: "1px solid #bae6fd",
            }}
          >
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <div className="text-sm">
              {pendingFlag.start && (
                <span className="font-medium text-blue-700">
                  {formatDate(pendingFlag.start)}
                </span>
              )}
              {pendingFlag.end && pendingFlag.start?.getTime() !== pendingFlag.end?.getTime() && (
                <>
                  <span className="text-blue-500 mx-2">→</span>
                  <span className="font-medium text-blue-700">
                    {formatDate(pendingFlag.end)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 제목 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: Sprint 1 종료, 출시일"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
              style={{
                background: "white",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0, 0, 0, 0.1)";
                e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
              required
            />
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              색상
            </label>
            <div className="flex gap-2 flex-wrap">
              {FLAG_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-lg transition-all duration-150"
                  style={{
                    background: c.value,
                    boxShadow:
                      color === c.value
                        ? `0 0 0 2px white, 0 0 0 4px ${c.value}`
                        : "0 1px 2px rgba(0,0,0,0.2)",
                    transform: color === c.value ? "scale(1.1)" : "scale(1)",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                boxShadow: `0 4px 12px ${color}40`,
              }}
            >
              Flag 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

