"use client";

import { useState, useEffect } from "react";
import type { WorkspaceMember } from "@/lib/data/workspaceMembers";

interface MemberEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { role: string; displayName: string }) => Promise<void>;
  member: WorkspaceMember;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

export function MemberEditDialog({
  isOpen,
  onClose,
  onSubmit,
  member,
}: MemberEditDialogProps) {
  const [role, setRole] = useState(member.role);
  const [displayName, setDisplayName] = useState(member.display_name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(member.role);
      setDisplayName(member.display_name || "");
    }
  }, [isOpen, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({ role, displayName });
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d0d7de]">
          <h2 className="text-xl font-semibold text-[#24292f]">멤버 정보 수정</h2>
          <p className="text-sm text-[#57606a] mt-1">
            멤버의 권한과 표시 이름을 수정합니다
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              이메일
            </label>
            <input
              type="text"
              value={member.email || ""}
              disabled
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-[#f6f8fa] text-[#57606a] cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              표시 이름 *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="표시 이름을 입력하세요"
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              권한 *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#57606a] mt-1">
              Admin: 모든 권한 / Manager: 관리 권한 / Member: 일반 사용자
            </p>
          </div>

          {/* User ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              User ID
            </label>
            <input
              type="text"
              value={member.user_id}
              disabled
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-[#f6f8fa] text-[#57606a] font-mono text-xs cursor-not-allowed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#d0d7de] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-[#24292f] bg-white hover:bg-[#f6f8fa] border border-[#d0d7de] rounded-md transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0550ae] rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

