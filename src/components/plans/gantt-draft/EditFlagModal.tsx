/**
 * Edit Flag Modal
 * - Flag 수정 및 삭제
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, FlagIcon, TrashIcon } from "@/components/common/Icons";
import { useDraftStore } from "./store";
import type { DraftFlag } from "./types";

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

interface EditFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  flag: DraftFlag | null;
}

export function EditFlagModal({ isOpen, onClose, flag }: EditFlagModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("#ef4444");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateFlagLocal = useDraftStore((s) => s.updateFlagLocal);
  const deleteFlag = useDraftStore((s) => s.deleteFlag);
  const selectFlag = useDraftStore((s) => s.selectFlag);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && flag) {
      setTitle(flag.title);
      setStartDate(flag.startDate);
      setEndDate(flag.endDate);
      setColor(flag.color || "#ef4444");
      setShowDeleteConfirm(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, flag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !flag) return;

    // 날짜 유효성 검사: endDate가 startDate보다 이전이면 swap
    let finalStart = startDate;
    let finalEnd = endDate;
    if (endDate < startDate) {
      finalStart = endDate;
      finalEnd = startDate;
    }

    // 로컬 상태만 변경 (저장 버튼 클릭 시 서버에 전송)
    updateFlagLocal(flag.clientId, {
      title: title.trim(),
      startDate: finalStart,
      endDate: finalEnd,
      color,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!flag) return;

    // 로컬 상태에서 soft delete (저장 버튼 클릭 시 서버에서 삭제)
    deleteFlag(flag.clientId);
    selectFlag(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || !flag) return null;

  const isPointFlag = startDate === endDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
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
                Flag 수정
              </h2>
              <p className="text-[11px] text-gray-500">
                {isPointFlag ? "포인트 Flag" : "범위 Flag"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {/* 날짜 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
                style={{
                  background: "white",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
                style={{
                  background: "white",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
                required
              />
            </div>
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

          {/* 삭제 확인 */}
          {showDeleteConfirm ? (
            <div
              className="p-4 rounded-xl"
              style={{
                background: "linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)",
                border: "1px solid #fecaca",
              }}
            >
              <p className="text-sm text-red-700 mb-3">
                정말 이 Flag를 삭제하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Flag 삭제</span>
            </button>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

