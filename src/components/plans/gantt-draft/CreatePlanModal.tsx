/**
 * Create Plan Modal
 * - 드래그 생성 후 보충 데이터 입력
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, CalendarIcon } from "@/components/common/Icons";
import type { PlanStatus } from "./types";

const STAGES = [
  "컨셉 기획",
  "UX 기획",
  "UI 디자인",
  "FE 개발",
  "BE 개발",
  "QA 검증",
  "릴리즈",
];

const STATUSES: PlanStatus[] = ["진행중", "완료", "보류", "취소"];

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; stage: string; status: PlanStatus }) => void;
  defaultValues?: {
    project: string;
    module: string;
    feature: string;
    startDate: string;
    endDate: string;
  };
}

export function CreatePlanModal({
  isOpen,
  onClose,
  onCreate,
  defaultValues,
}: CreatePlanModalProps) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("컨셉 기획");
  const [status, setStatus] = useState<PlanStatus>("진행중");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setStage("컨셉 기획");
      setStatus("진행중");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      stage,
      status,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--notion-text)" }}
          >
            새 계획 만들기
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon
              className="w-5 h-5"
              style={{ color: "var(--notion-text-muted)" }}
            />
          </button>
        </div>

        {/* 컨텍스트 정보 */}
        {defaultValues && (
          <div
            className="px-4 py-2 border-b"
            style={{
              borderColor: "var(--notion-border)",
              background: "var(--notion-bg-secondary)",
            }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--notion-text-muted)" }}>
              <span className="font-medium">{defaultValues.project}</span>
              <span>›</span>
              <span>{defaultValues.module}</span>
              <span>›</span>
              <span>{defaultValues.feature}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: "var(--notion-text-muted)" }}>
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                {defaultValues.startDate} ~ {defaultValues.endDate}
              </span>
            </div>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* 제목 */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="계획 제목을 입력하세요"
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              autoComplete="off"
            />
          </div>

          {/* 스테이지 */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              스테이지
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    stage === s
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  style={{
                    background:
                      stage === s ? undefined : "var(--notion-bg-tertiary)",
                    color: stage === s ? "white" : "var(--notion-text)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 */}
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--notion-text)" }}
            >
              상태
            </label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    status === s
                      ? s === "진행중"
                        ? "bg-blue-500 text-white"
                        : s === "완료"
                        ? "bg-green-500 text-white"
                        : s === "보류"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  style={{
                    background:
                      status === s ? undefined : "var(--notion-bg-tertiary)",
                    color: status === s ? "white" : "var(--notion-text)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md transition-colors"
              style={{
                background: "var(--notion-bg-tertiary)",
                color: "var(--notion-text)",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#3b82f6",
                color: "white",
              }}
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

