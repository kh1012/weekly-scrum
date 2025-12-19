/**
 * Feedback Detail Actions
 * 관리자 액션 (상태 변경, 해결 처리) - 커스텀 드롭다운 UI
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import { ResolvePanel } from "@/components/feedback/ResolvePanel";
import type { FeedbackWithDetails, FeedbackStatus, Release } from "@/lib/data/feedback";

interface FeedbackDetailActionsProps {
  feedback: FeedbackWithDetails;
  releases: Release[];
  isAdminOrLeader: boolean;
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; color: string; icon: React.ReactNode }[] = [
  {
    value: "open",
    label: "Open",
    color: "#3b82f6",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "#f59e0b",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "#22c55e",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function FeedbackDetailActions({
  feedback,
  releases,
  isAdminOrLeader,
}: FeedbackDetailActionsProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(feedback.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (newStatus === currentStatus) {
      setIsDropdownOpen(false);
      return;
    }

    // resolved 상태는 ResolvePanel로만 변경
    if (newStatus === "resolved") {
      alert("해결 완료는 아래 'Mark as Resolved' 패널을 사용해주세요");
      setIsDropdownOpen(false);
      return;
    }

    const confirmed = confirm("상태를 변경하시겠습니까?");
    if (!confirmed) {
      setIsDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    setError(null);
    setIsDropdownOpen(false);

    const result = await updateFeedbackStatus(feedback.id, newStatus);

    setIsUpdating(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      router.refresh();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === currentStatus)!;

  return (
    <div className="space-y-6">
      {/* 상태 선택 */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "white",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
          Change Status
        </h3>

        <div className="space-y-4">
          {/* 커스텀 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isUpdating}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 outline-none disabled:opacity-50"
              style={{
                background: `${currentOption.color}10`,
                border: `1px solid ${currentOption.color}30`,
                color: currentOption.color,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${currentOption.color}20` }}
                >
                  {currentOption.icon}
                </span>
                <span>{currentOption.label}</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 드롭다운 목록 */}
            {isDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                style={{
                  background: "white",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      option.value === currentStatus
                        ? "bg-gray-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${option.color}15`,
                        color: option.color,
                      }}
                    >
                      {option.icon}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: option.value === currentStatus ? option.color : "#374151" }}
                    >
                      {option.label}
                    </span>
                    {option.value === currentStatus && (
                      <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke={option.color} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Panel (status가 resolved가 아닐 때만 표시) */}
      {currentStatus !== "resolved" && (
        <ResolvePanel
          feedbackId={feedback.id}
          releases={releases}
          onResolved={() => {
            setCurrentStatus("resolved");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
