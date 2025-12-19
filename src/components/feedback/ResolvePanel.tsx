/**
 * Resolve Panel
 * leader/admin 전용 해결 패널 - 커스텀 드롭다운 UI (viewport 기반 방향)
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import type { Release } from "@/lib/data/feedback";

interface ResolvePanelProps {
  feedbackId: string;
  releases: Release[];
  onResolved: () => void;
}

export function ResolvePanel({
  feedbackId,
  releases,
  onResolved,
}: ResolvePanelProps) {
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // viewport 기반 드롭다운 방향 계산
  const calculateDirection = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = Math.min(releases.length * 60 + 60, 300); // 예상 드롭다운 높이

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setDropdownDirection("up");
    } else {
      setDropdownDirection("down");
    }
  }, [releases.length]);

  // 드롭다운 열릴 때 방향 계산
  useEffect(() => {
    if (isDropdownOpen) {
      calculateDirection();
    }
  }, [isDropdownOpen, calculateDirection]);

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

  const handleResolve = async () => {
    if (!selectedReleaseId) {
      setError("릴리즈를 선택해주세요");
      return;
    }

    const confirmed = confirm("이 피드백을 해결 완료로 표시하시겠습니까?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateFeedbackStatus(
      feedbackId,
      "resolved",
      selectedReleaseId
    );

    setIsSubmitting(false);

    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  const selectedRelease = releases.find((r) => r.id === selectedReleaseId);

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
      }}
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Mark as Resolved
      </h3>

      <div className="space-y-4">
        {/* 릴리즈 선택 - 커스텀 드롭다운 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolved in Release <span className="text-red-500">*</span>
          </label>

          <div className="relative" ref={dropdownRef}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none disabled:opacity-50"
              style={{
                background: selectedRelease ? "rgba(99, 102, 241, 0.08)" : "white",
                border: selectedRelease ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid #e2e8f0",
                color: selectedRelease ? "#4f46e5" : "#64748b",
              }}
            >
              <div className="flex items-center gap-3">
                {selectedRelease ? (
                  <>
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(99, 102, 241, 0.15)" }}
                    >
                      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{selectedRelease.version}</div>
                      <div className="text-xs text-gray-500">{selectedRelease.title}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </span>
                    <span>릴리즈 선택</span>
                  </>
                )}
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${isDropdownOpen ? (dropdownDirection === "up" ? "" : "rotate-180") : ""}`}
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
                className={`absolute left-0 right-0 rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto ${
                  dropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
                }`}
                style={{
                  background: "white",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                }}
              >
                {releases.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    등록된 릴리즈가 없습니다
                  </div>
                ) : (
                  releases.map((release) => (
                    <button
                      key={release.id}
                      type="button"
                      onClick={() => {
                        setSelectedReleaseId(release.id);
                        setIsDropdownOpen(false);
                        setError(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        release.id === selectedReleaseId
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: release.id === selectedReleaseId ? "rgba(99, 102, 241, 0.15)" : "#f1f5f9",
                          color: release.id === selectedReleaseId ? "#4f46e5" : "#64748b",
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <div
                          className="font-semibold truncate"
                          style={{ color: release.id === selectedReleaseId ? "#4f46e5" : "#1e293b" }}
                        >
                          {release.version}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{release.title}</div>
                      </div>
                      {release.id === selectedReleaseId && (
                        <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#dc2626",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={handleResolve}
          disabled={isSubmitting || !selectedReleaseId}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              처리 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Resolved
            </>
          )}
        </button>
      </div>
    </div>
  );
}
