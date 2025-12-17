/**
 * Edit Plan Modal
 * - 기존 bar의 상세 정보 수정
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, CalendarIcon, UserIcon, TrashIcon } from "@/components/common/Icons";
import type { PlanStatus, DraftAssignee, DraftBar } from "./types";
import type { AssigneeRole } from "@/lib/data/plans";
import type { WorkspaceMemberOption } from "./CreatePlanModal";

const STAGES = [
  "컨셉 기획",
  "상세 기획",
  "UI 디자인",
  "FE 개발",
  "BE 개발",
  "QA 검증",
];

const STATUSES: PlanStatus[] = ["진행중", "완료", "보류", "취소"];

const ROLES: { value: AssigneeRole; label: string; color: string }[] = [
  { value: "planner", label: "기획", color: "#f59e0b" },
  { value: "designer", label: "디자인", color: "#ec4899" },
  { value: "fe", label: "FE", color: "#3b82f6" },
  { value: "be", label: "BE", color: "#10b981" },
  { value: "qa", label: "QA", color: "#8b5cf6" },
];

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    stage: string;
    status: PlanStatus;
    assignees: DraftAssignee[];
  }) => void;
  onDelete: () => void;
  bar: DraftBar | null;
  members?: WorkspaceMemberOption[];
}

export function EditPlanModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  bar,
  members = [],
}: EditPlanModalProps) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("컨셉 기획");
  const [status, setStatus] = useState<PlanStatus>("진행중");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AssigneeRole>("planner");

  const inputRef = useRef<HTMLInputElement>(null);

  // bar가 변경될 때 초기값 설정
  useEffect(() => {
    if (isOpen && bar) {
      setTitle(bar.title);
      setStage(bar.stage);
      setStatus(bar.status);
      
      // 첫 번째 담당자 정보
      if (bar.assignees && bar.assignees.length > 0) {
        setSelectedAssignee(bar.assignees[0].userId);
        setSelectedRole(bar.assignees[0].role);
      } else {
        setSelectedAssignee("");
        setSelectedRole("planner");
      }
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, bar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // 담당자 생성
    const assignees: DraftAssignee[] = [];
    if (selectedAssignee) {
      const member = members.find((m) => m.userId === selectedAssignee);
      assignees.push({
        userId: selectedAssignee,
        role: selectedRole,
        displayName: member?.displayName,
      });
    }

    onSave({
      title: title.trim(),
      stage,
      status,
      assignees,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleDelete = () => {
    const confirmed = confirm("이 계획을 삭제하시겠습니까?");
    if (confirmed) {
      onDelete();
    }
  };

  if (!isOpen || !bar) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* 배경 - Airbnb 스타일: 부드러운 블러 효과 */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
        onClick={onClose}
      />

      {/* 모달 - Airbnb 스타일 */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          background: "white",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* 헤더 - 그라디언트 배경 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            계획 수정
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-all duration-150 active:scale-95"
              title="삭제"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-150 active:scale-95"
            >
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 기간 정보 배너 */}
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">기간</div>
            <div className="text-sm font-semibold text-gray-800">
              {bar.startDate} ~ {bar.endDate}
            </div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="계획 제목을 입력하세요"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#1e293b",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
              autoComplete="off"
            />
          </div>

          {/* 스테이지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              스테이지
            </label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 active:scale-95 ${
                    stage === s
                      ? "text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{
                    background: stage === s 
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" 
                      : "#f1f5f9",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 담당자 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <UserIcon className="w-4 h-4" />
              담당자
            </label>
            <div className="space-y-3">
              {/* 담당자 선택 */}
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 outline-none cursor-pointer"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
                }}
              >
                <option value="">담당자 선택 (선택사항)</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName || member.email || member.userId}
                  </option>
                ))}
              </select>

              {/* 역할 선택 - 담당자 선택 시에만 활성화 */}
              <div className="flex gap-1.5">
                {ROLES.map((role) => {
                  const isDisabled = !selectedAssignee;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => !isDisabled && setSelectedRole(role.value)}
                      disabled={isDisabled}
                      className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                        isDisabled 
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "text-white shadow-md active:scale-95"
                            : "hover:opacity-80 active:scale-95"
                      }`}
                      style={{
                        background: isDisabled 
                          ? "#e5e7eb" 
                          : isSelected 
                            ? role.color 
                            : `${role.color}15`,
                        color: isDisabled 
                          ? "#9ca3af" 
                          : isSelected 
                            ? "white" 
                            : role.color,
                        boxShadow: isSelected && !isDisabled
                          ? `0 0 0 2px white, 0 0 0 4px ${role.color}`
                          : undefined,
                      }}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 선택된 담당자 표시 */}
            {selectedAssignee && (
              <div 
                className="mt-3 flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "#f8fafc" }}
              >
                <span
                  className="px-2.5 py-1 text-xs font-bold rounded-md text-white"
                  style={{
                    background: ROLES.find((r) => r.value === selectedRole)?.color || "#6b7280",
                  }}
                >
                  {ROLES.find((r) => r.value === selectedRole)?.label}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {members.find((m) => m.userId === selectedAssignee)?.displayName}
                </span>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 active:scale-95 hover:bg-gray-100"
              style={{ color: "#64748b" }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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

